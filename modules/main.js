import { registerSettings } from "./settings.js";
import { bindFunctions } from "./bindings.js";
import { advance, loadStory, makeChoice } from './interfaces.js';
import { parseInline } from './parsing.js';

Hooks.once("init", async () => {
    // Add types to foundry's namespace
    window.FoundryInk = {
        advance,
        loadStory,
        makeChoice,
        i18n: (relativePath, formatObj={}) => {
            return game.i18n.format(`foundry-ink.${relativePath}`, formatObj)
        }
    };
});

Hooks.once("setup", () => {
    // Configure the Module Settings Menu
    registerSettings();

    // Notify developers
    console.log(FoundryInk.i18n('templates.general', {
        header: FoundryInk.i18n('title'),
        body: FoundryInk.i18n('ready')
    }));

    // Call this hook after making a story in order to renew its bindings
    Hooks.on("foundry-ink.bindExternalFunctions", (sourcefile, inkStory) => {

        // Register error handling
        inkStory.onError = (error) => {
            console.error(FoundryInk.i18n('templates.issue', {
                header: FoundryInk.i18n('title'),
                cause: FoundryInk.i18n('inkjs.name'),
                body: error
            }));
        }

        // Rebind default bindings library if the user wants them
        if (game.settings.get("foundry-ink", "useDefaultBindings")) {
            bindFunctions(inkStory);
        }
    });

    /**
     * This hook can be called by external modules as an alternative to clicking chat buttons
     */
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
});

