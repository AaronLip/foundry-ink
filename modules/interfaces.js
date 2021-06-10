import '../modules/ink.js';
import * as serde from '../modules/serialization.js';
import * as parsing from '../modules/parsing.js';

/*
 * Loads a compiled json file for the ink runtime, then returns an inkjs interpreter for that file
 */
export async function loadStory(jsonFilename) {
    var f = await fetch(jsonFilename);
    var json = await f.text();
    return new inkjs.Story(json);
}

/*
 * Advance the story, notifying all hook listeners of new lines or text to handle
 */
export async function advance(inkStory, sourcefile) {
    // Allow modules to bind external functions when the story is being re-instantiated
    await Hooks.callAll("foundry-ink.bindExternalFunctions", sourcefile, inkStory);

    // Consume story lines until choices or the end
    var lines = [];

    while (inkStory.canContinue) {
        var line = inkStory.Continue();

        Hooks.callAll("foundry-ink.continue",
            line,
            sourcefile
        );

        lines.push(line);
    }

    if (inkStory.state.callstackDepth > 1) {
        console.warn(FoundryInk.i18n('warnings.tunnel-saves'));
    }
    Hooks.callAll("foundry-ink.maxContinue",
        lines,
        inkStory.currentChoices,
        sourcefile,
        inkStory.state.toJson()
    );
}

// Console Rendering Logic
Hooks.on("foundry-ink.continue", (line, sourcefile) => {
    if (game.settings.get('foundry-ink', 'consoleRender')) {
        console.log(FoundryInk.i18n('templates.general', {
            header: sourcefile, 
            body: line
        }));
    }
})

Hooks.on("foundry-ink.maxContinue", (lines, choices, sourcefile, state) => {
    window.FoundryInk._lastStory = {
        sourcefile: sourcefile,
        state: state
    }
    if (game.settings.get('foundry-ink', 'consoleRender')) {
        console.log(FoundryInk.i18n('templates.general', {
            header: sourcefile,
            body: FoundryInk.i18n('templates.choice-prompt', {
                choices: Object.entries(choices).map(entry => `${entry[0]}: ${entry[1].text}`).join('\n')
            })
        }));
    }
})

export async function makeChoice(choiceIndex) {
    Hooks.callAll("foundry-ink.makeChoice", choiceIndex, window.FoundryInk._lastStory.sourcefile, window.FoundryInk._lastStory.state);
}

// Set up Chat Message handlers when messages are loaded
Hooks.on("renderChatMessage", (message, html, data) => {

    suppressVisited(html);

    // Register listeners for unvisited chat buttons
    if (game.settings.get('foundry-ink', 'chatRender')) {

        var currentChoices = $(html).find('.ink-choice:not(:disabled)');

        currentChoices.on('click', async function() {
            var message = game.collections.get("ChatMessage").get($(event.target).closest(".chat-message").data("messageId"));

            var session = serde.SessionData.fromFlag(message);
            session.visited = true;
            session.toFlag(message);

            Hooks.callAll(
                "foundry-ink.makeChoice",
                $(event.target).data('index'),
                session);
        });
    }

    // TODO: Reregister hooks here, switch to journal entries
});

Hooks.on("foundry-ink.makeChoice", async (choiceIndex, sessionData) => {
    suppressVisited(document);
});

// Suppress listeners on visited choices
function suppressVisited(parent) {
    var choiceButtons = $(parent).find('.ink-choice');

    for (var choiceButton of choiceButtons) {
        var message = game.collections.get("ChatMessage").get($(choiceButton).closest(".chat-message").data("messageId"));
        if (serde.SessionData.fromFlag(message)?.visited) {

            $(choiceButton).off('click');
            $(choiceButton).prop('disabled', true);
        }
    }
}

// Group lines by speaker, in order
function speakerOrder(lines) {
    var speakerScripts = (lines

    // Convert the text into { speaker?: speaker, line: line } format
    .map(line => {
        var parse = parsing.parseInline(
            line, { 
                command: 'speaker',
                type: 'style',
                argument: 'line'
            });

        if (parse === undefined) {
            return { line: line };
        } else {
            return parse;
        }
    })

    // Aggregrate lines from each speaker, in order
    .reduce((output, parse) => {
        if (!output.length || output[output.length - 1][0] !== parse.speaker) {
            output.push({ speaker: parse.speaker, lines: [parse.line] })
        } else {
            output[output.length - 1].lines.push(parse.line);
        }
        return output;
    }, []));

    return speakerScripts;
}

// Output a message for each speaker, containing all their lines
function sayDialogue(lines) {
    speakerOrder(lines).map(async speakerScript => {

        const html = await renderTemplate("modules/foundry-ink/templates/chat/vino-dialogue.html", {
            lines: speakerScript.lines.filter(line => line && (line !== '\n'))
        });

        var speaker = {
            actor: game.actors.getName(speakerScript.speaker)
        }

        Hooks.callAll('handleCreateChatMessage', (await ChatMessage.create({
            content: html,
            speaker: speaker,
            type: CONST.CHAT_MESSAGE_TYPES.IC
        })));
    });
}

// parses out scripting syntax from choices
function choiceParse(choices, sourcefile, state) {

    return Object.entries(choices).map(choice => {
        var index = choice[0];
        var text = choice[1].text;

        var parse = parsing.parseInterface(text);

        var choiceContainer = {
            text: text,
            index: index,
            hooks: []
        };

        if (parse !== undefined) {
            if (parse.interface === "Hooks") {
                choiceContainer.interface = parse.interface;
                var dataParse = parsing.parseAltText(parse.data, { data: 'hookname', alttext: 'choicetext' });

                if (dataParse === undefined) {
                    console.warn(FoundryInk.i18n('templates.issue', {
                        header: FoundryInk.i18n('title'),
                        cause: 'Hook parsing',
                        body: FoundryInk.i18n('warnings.no-choicetext', {
                            name: parse.data
                        })
                    }));

                    choiceContainer.text = parse.data;
                    basicChoiceHook(parse.data, index, sourcefile, state);
                } else {
                    choiceContainer.text = dataParse.choicetext;
                    basicChoiceHook(dataParse.hookname, index, sourcefile, state);
                }
            }
        }
        return choiceContainer;
    });
}

function basicChoiceHook(triggerHook, choiceIndex, sourcefile, state) {
    var choiceHook = {
        triggerHook: triggerHook,
        index: choiceIndex,
        sourcefile: sourcefile,
        state: state
    }
    Hooks.once(triggerHook, () => {
        Hooks.callAll("foundry-ink.makeChoice", choiceIndex, sourcefile, state);
    });
    return choiceHook;
}

function listenerChoiceHook(triggerHook, conditionFn, choiceIndex, sourcefile, state) {
    var choiceHook = {
        triggerHook: triggerHook,
        index: choiceIndex,
        sourcefile: sourcefile,
        state: state
    }
    var handle = Hooks.on(triggerHook, (...args) => {
        if (conditionFn(...args)) {
            Hooks.off(triggerHook, handle);
            Hooks.callAll("foundry-ink.makeChoice", choiceIndex, sourcefile, state);
        }
    });
    return choiceHook;
}