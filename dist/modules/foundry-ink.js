import { registerSettings } from './settings.js';
import { bindFunctions } from "./bindings.js";
import { parseInline } from './parsing.js';

import { continueSession } from './interaction-loop.js';
import './interfaces/chat-interface.js';
import './interfaces/console-interface.js';

Hooks.once("init", async () => {
    // Add types to foundry's namespace
    window.FoundryInk = {
        loadStory: async (jsonFilename) => {
            var f = await fetch(jsonFilename);
            var json = await f.text();
            return new inkjs.Story(json);
        },
        i18n: (relativePath, formatObj={}) => {
            return game.i18n.format(`foundry-ink.${relativePath}`, formatObj)
        },
        settings: (name, value=undefined) => {
            if (value === undefined) {
                return game.settings.get('foundry-ink', name);
            } else {
                game.settings.set('foundry-ink', name, value);
            }
        },
        continueSession: continueSession
    };
    Hooks.callAll('foundry-ink.loadInterfaces');
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
    });

    /**
     * This hook can be called by external modules as an alternative to clicking chat buttons
     */
    Hooks.on("foundry-ink.makeChoice", async (choiceIndex, sessionData) => {
        continueSession(sessionData, choiceIndex);
    });
});

