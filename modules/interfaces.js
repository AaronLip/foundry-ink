import '../modules/ink.js';

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
    Hooks.callAll("foundry-ink.bindExternalFunctions", sourcefile, inkStory);

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
        console.warn('Ink in the Foundry |', 'The ink interpreter is inside a tunnel. Bugs will occur if you save the state here.')
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
        console.log(sourcefile, "|", line);
    }
})

Hooks.on("foundry-ink.maxContinue", (lines, choices, sourcefile, state) => {
    window.FoundryInk._lastStory = {
        sourcefile: sourcefile,
        state: state
    }
    if (game.settings.get('foundry-ink', 'consoleRender')) {
        console.log(sourcefile, "|", "choices\n" + Object.entries(choices).map(entry => `${entry[0]}: ${entry[1].text}`).join('\n'));
    }
})

export async function makeChoice(choiceIndex) {
    Hooks.callAll("foundry-ink.makeChoice", choiceIndex, window.FoundryInk._lastStory.sourcefile, window.FoundryInk._lastStory.state);
}

// Chat Rendering Logic
Hooks.on("foundry-ink.maxContinue", async (lines, choices, sourcefile, state) => {

    var message;
    var speaker = { alias: "Ink in the Foundry" }

    if (game.settings.get('foundry-ink', 'chatRender')) {

        if (game.settings.get('foundry-ink', 'dialogueSyntax') == 1) {

            sayDialogue(lines);

            var html = await renderTemplate("modules/foundry-ink/templates/chat/choices.html", {
                choices: choices,
                lines: ""
            });

            message = await ChatMessage.create({
                content: choices.length > 0 ? html : "THE END",
                speaker: speaker,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        } else {

            const html = await renderTemplate("modules/foundry-ink/templates/chat/choices.html", {
                choices: choices,
                lines: lines.filter(line => line && (line !== '\n')).concat(choices.length > 0 ? [] : ["THE END"])
            });

            message = await ChatMessage.create({
                content: html,
                speaker: speaker,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }

        // Stash the state within the chat message for resume after foundry reboots
        await message.setFlag('foundry-ink', 'state', state);
        await message.setFlag('foundry-ink', 'sourcefile', sourcefile);
        await message.setFlag('foundry-ink', 'visited', false);
    }
});

// Set up Chat Message handlers when messages are loaded
Hooks.on("renderChatMessage", function(message, html, data) {

    suppressVisited();

    // Register listeners for unvisisted chat buttons
    if (game.settings.get('foundry-ink', 'chatRender')) {

        var currentChoices = $(html).find('.ink-choice:not(:disabled)');

        currentChoices.on('click', async function() {
            var message = game.collections.get("ChatMessage").get($(event.target).closest(".chat-message").data("messageId"));

            message.setFlag('foundry-ink', 'visited', true);

            Hooks.callAll(
                "foundry-ink.makeChoice",
                $(event.target).data('index'),
                message.getFlag('foundry-ink', 'sourcefile'),
                message.getFlag('foundry-ink', 'state'));
        });
    }
});

Hooks.on("foundry-ink.makeChoice", async (choiceIndex, sourcefile, state=null) => {
    suppressVisited();
});

// Suppress listeners on visited choices
function suppressVisited() {
    var choiceButtons = $(document).find('.ink-choice:not(:disabled)');

    for (var choiceButton of choiceButtons) {
        var message = game.collections.get("ChatMessage").get($(choiceButton).closest(".chat-message").data("messageId"));
        if (message.getFlag('foundry-ink', 'visited')) {

            $(choiceButton).off('click');
            $(choiceButton).prop('disabled', true);
        }
    }
}

// Group lines by speaker, in order
function speakerOrder(lines) {
    return lines.map(line => line.split(': ')).reduce((output, pair) => {
        var [label, data] = pair;

        if (!output.length || output[output.length - 1][0] !== label) {
            output.push([label, [data]])
        } else {
            output[output.length - 1][1].push(data);
        }
        return output;
    }, []);
}

// Output a message for each speaker, containing all their lines
function sayDialogue(lines) {
    speakerOrder(lines).map(async dialogueBySpeaker => {
        var [speaker, dialogue] = dialogueBySpeaker;

        const html = await renderTemplate("modules/foundry-ink/templates/chat/vino-dialogue.html", {
            lines: dialogue.filter(line => line && (line !== '\n'))
        });

        var speaker = {
            actor: game.actors.getName(speaker)
        }

        Hooks.callAll('handleCreateChatMessage', (await ChatMessage.create({
            content: html,
            speaker: speaker,
            type: CONST.CHAT_MESSAGE_TYPES.IC
        })));
    });
}