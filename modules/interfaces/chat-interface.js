import * as parsing from '../parsing.js';

Hooks.on('foundry-ink.deliverPage', (page, sessionData) => {

    if (FoundryInk.settings('chatRender')) {

        var grouped = groupBySpeaker(page.frames);
        console.log(grouped);

    }

});

Hooks.on('foundry-ink.deliverFrame', (line, sessionData) => {
    console.log(dialogueParse(line));
    Hooks.callAll('foundry-ink.deliverDialogue', dialogueParse(line));
});

function dialogueParse(frame) {

    var currentSetting = game.settings.settings.get('foundry-ink.dialogueSyntax').choices[
        FoundryInk.settings('dialogueSyntax')
    ];
    switch (currentSetting) {

        case FoundryInk.i18n('settings.dialogue-syntax.none'):

            return undefined;


        case FoundryInk.i18n('settings.dialogue-syntax.inline'):

            return parsing.parseInline(frame.line, {
                command: 'speaker',
                type: 'style',
                argument: 'line'});


        case FoundryInk.i18n('settings.dialogue-syntax.tag'):

            return frame.tags.find(tag => {
                var parse = parsing.parseInline(tag, {
                    command: 'command',
                    type: 'style',
                    argument: 'speaker'
                });
                return (parse?.command == 'SPEAKER') && parse?.argument;
            });


        default:
            var dialogueSetting = FoundryInk.i18n('settings.dialogue-syntax.name');
            var dialogueSettingText = game.settings.settings.get(
                'foundry-ink.dialogueSyntax'
                ).choices[currentDialogueSetting];

            // TODO: localize
            console.warning(FoundryInk.i18n('templates.general', {
                header: FoundryInk.i18n('title'),
                body: `The setting "${dialogueSettingText}" for "${dialogueSetting}" is not currently supported by foundry-ink.`
            }));
            return undefined;
    }
}

function groupBySpeaker(frames) {
    return frames

    // Parse the speaker data for each frame
    .map(frame => {
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