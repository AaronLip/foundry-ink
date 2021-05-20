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

Hooks.on("foundry-ink.bindExternalFunctions", (sourcefile, inkStory) => {
    // Error handling
    inkStory.onError = (error) => { console.error("Ink in the Foundry (inkjs error) |", error); };

     // Helpful bindings
    inkStory.BindExternalFunction("ROLL", (formula) => (new Roll(formula)).roll().total);
    inkStory.BindExternalFunction("ACTOR", (name, propertyString) => {
        var actor = ActorDirectory.collection.getName(name);
        if (actor == undefined) {
            console.error("Ink in the Foundry (ACTOR Binding) |", `The actor "${name}" was not found. Make sure this name was not a typo!`);
            return null;
        }

        var property = getProperty(actor, "data." + propertyString);

        if (!["number", "boolean", "string"].some(t => typeof(property) === t)) {
            console.error("Ink in the Foundry (ACTOR Binding) |", `actor.data.${propertyString} returned a value inkjs cannot handle: ${property}`);
            return null;
        }
        return property;
    });
    inkStory.BindExternalFunction("MACRO", (name) => {
        var macro = MacroDirectory.collection.getName(name);
        if (macro == undefined) {
            console.error("Ink in the Foundry (MACRO Binding) |", `The macro "${name}" was not found. Make sure this name was not a typo!`);
            return false;
        }

        macro.execute();
        return true;
    })
});