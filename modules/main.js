import { advance, loadStory, makeChoice } from '../modules/interfaces.js';

Hooks.once("init", async () => {
    // Notify developers
    console.log("Ink in the Foundry | Ink in the Foundry is initializing");

    // Add types to foundry's namespace
    window.FoundryInk = {
        advance,
        loadStory,
        makeChoice
    };

    await game.settings.register('foundry-ink', 'chatRender', {
        name: 'ChatMessage Renderer',
        hint: 'Enabling this renderer will output ink stories to the chat window.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    await game.settings.register('foundry-ink', 'consoleRender', {
        name: 'Console Renderer',
        hint: 'Enabling this renderer will output ink stories to the F12 debug console.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });

    await game.settings.register('foundry-ink', 'dialogueSyntax', {
        name: 'Dialogue Indication Syntax',
        hint: 'If your ink script uses a common syntax to indicate speakers of dialogue, then you can use this drop down to select it.',
        scope: 'world',
        config: true,
        type: String,
        default: 'None',
        choices: ['None', '<SPEAKER>: ...', '... #Dialogue: <SPEAKER>']
    });

});

// This hook can be called by external modules as an alternative to clicking chat buttons
Hooks.on("foundry-ink.makeChoice", async (choiceIndex, sourcefile, state=null) => {

    // Prepare a story instance
    var fink = await FoundryInk.loadStory(sourcefile);
    if (state !== null) {
        fink.state.LoadJson(state);
    }

    // Make the choice
    fink.ChooseChoiceIndex(choiceIndex);
    FoundryInk.advance(fink, sourcefile);
});