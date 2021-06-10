import * as parsing from '../parsing.js';
import * as serde from '../serialization.js';

/** Emit chat messages whenever complete paged info about the story is available */
Hooks.on('foundry-ink.deliverPage', async (page, sessionData) => {

    if (FoundryInk.settings('chatRender')) {

        var grouped = groupBySpeaker(page.frames);

        for (var group of grouped) {
            var dialogueParseEnabled = ['inline', 'tag'].some(s => _isDialogueSetting(s));

            // Dispatch the message to an html template, dependent on whether support for dialogue is enabled (for modules that hook chat)
            var template = dialogueParseEnabled ? "modules/foundry-ink/templates/chat/vino-dialogue.html" : "modules/foundry-ink/templates/chat/choices.html";
            var html = await renderTemplate(
                template,
                {
                    lines: group.frames.reduce((lines, frame) => {
                        if (frame.line != '\n') {
                            lines.push(frame.line);
                        }
                        return lines;
                    }, []),
                    choices: dialogueParseEnabled ? [] : page.choices
                });

            var actor = game.actors.getName(group.speaker);

            var message = await ChatMessage.create({
                content: html,
                speaker: actor !== undefined ? { actor: actor } : { alias: group.speaker },
                type: group.speaker !== undefined ? CONST.CHAT_MESSAGE_TYPES.IC : CONST.CHAT_MESSAGE_TYPES.OOC
            });

            // Use an additional choice message after all speakers have spoken to avoid bugging out chat hook modules
            if (dialogueParseEnabled) {
                message = await ChatMessage.create({
                    content: await renderTemplate(
                        "modules/foundry-ink/templates/chat/choices.html",
                        {
                            lines: [],
                            choices: page.choices
                        }),
                    type: CONST.CHAT_MESSAGE_TYPES.OTHER
                });
            }
            new serde.SessionData(sessionData).toFlag(message);
        }
    }

});

// ----- Hook Handler Declarations ----- //

/** Notifies when a piece of dialogue has been delivered */
Hooks.on('foundry-ink.deliverFrame', async (frame, sessionData) => {
    Hooks.callAll('foundry-ink.deliverDialogue', dialogueParse(frame));
});

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

// ----- Format Conversion Functions ----- //

function dialogueParse(frame) {

    if (_isDialogueSetting('none')) {
        return undefined;
    }

    if (_isDialogueSetting('inline')) {
        return parsing.parseInline(frame.line, {
            command: 'speaker',
            type: 'style',
            argument: 'line'});
    }

    if (_isDialogueSetting('tag')) {
        var result = frame.tags.map(tag => parsing.parseInline(tag, {
            command: 'command',
            type: 'style',
            argument: 'speaker'
        })).find(parse => (parse?.command == 'SPEAKER') && parse?.speaker)
        return { speaker: result?.speaker, style: result?.style, line: frame.line };
    }

    // Unsupported Dialogue Setting
    var dialogueSetting = FoundryInk.i18n('settings.dialogue-syntax.name');
    var dialogueSettingText = game.settings.settings.get(
        'foundry-ink.dialogueSyntax'
        ).choices[FoundryInk.settings('dialogueSyntax')];

    // TODO: localize
    console.warning(FoundryInk.i18n('templates.general', {
        header: FoundryInk.i18n('title'),
        body: `The setting "${dialogueSettingText}" for "${dialogueSetting}" is not currently supported by foundry-ink.`
    }));
    return undefined;
}

function groupBySpeaker(frames) {
    
    // Parse the speaker data for each frame
    return frames.map(frame => {
        var parse = dialogueParse(frame);
        if (parse === undefined) {
            return frame;
        } else {
            parse.line ??= frame.line;
            parse.tags = frame.tags;
            return parse;
        }
    })

    // Aggregrate lines from each speaker, in order
    .reduce((groups, parse) => {
        if (!groups.length || groups[groups.length - 1].speaker !== parse.speaker) {
            groups.push({ speaker: parse?.speaker, frames: [parse] });
        } else {
            groups[groups.length - 1].frames.push(parse);
        }
        return groups;
    }, []);
}

// ----- Utility Functions ----- //

function _isDialogueSetting(setting) {
    var currentSetting = game.settings.settings.get('foundry-ink.dialogueSyntax').choices[FoundryInk.settings('dialogueSyntax')];
    return currentSetting == FoundryInk.i18n(`settings.dialogue-syntax.${setting}`);
}

/** Suppresses DOM listeners on visited choices */
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