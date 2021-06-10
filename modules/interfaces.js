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