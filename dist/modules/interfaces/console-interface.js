// ----- Hook Handler Declarations ----- //
Hooks.on('foundry-ink.loadInterfaces', () => {
    FoundryInk.makeChoice = (choiceIndex) => Hooks.callAll("foundry-ink.makeChoice", choiceIndex, FoundryInk._lastStory);
});

Hooks.on("foundry-ink.deliverLine", (line, sessionData) => {
    if (game.settings.get('foundry-ink', 'consoleRender')) {
        console.log(FoundryInk.i18n('templates.general', {
            header: sessionData.sourcefile, 
            body: line
        }));
    }
});

Hooks.on("foundry-ink.deliverChoices", (choices, sessionData) => {
    window.FoundryInk._lastStory = sessionData;

    if (game.settings.get('foundry-ink', 'consoleRender')) {
        console.log(FoundryInk.i18n('templates.general', {
            header: sessionData.sourcefile,
            body: FoundryInk.i18n('templates.choice-prompt', {
                choices: Object.entries(choices).map(entry => `${entry[0]}: ${entry[1].text}`).join('\n')
            })
        }));
    }
})