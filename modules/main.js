import { registerSettings } from "./settings.js";
import { bindFunctions } from "./bindings.js";
import { advance, loadStory, makeChoice } from './interfaces.js';

Hooks.once("init", async () => {
    // Notify developers
    console.log("Ink in the Foundry | Ink in the Foundry is initializing");

    // Add types to foundry's namespace
    window.FoundryInk = {
        advance,
        loadStory,
        makeChoice
    };

    registerSettings();
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

    if (game.settings.get("foundry-ink", "useDefaultBindings")) {
        bindFunctions(inkStory);
    }
});