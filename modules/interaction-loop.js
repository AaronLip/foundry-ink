import '../modules/ink.js';
import { bindFunctions } from "./bindings.js";
import * as serde from '../modules/serialization.js';
import * as parsing from '../modules/parsing.js';

/*
 * User input                 > callAll(makeChoice
 * Make an ink story instance > callAll(onResume
 * Bind error handler
 * Bind external functions    > callAll(onBind
 * Emit a line                > callAll(storyLine ?> callAll(storyTag ?> callAll(bindingCall
 *                                          |
 *                                       Dialogue----------------------------------------------> callAll(onDialogue
 *                                       Hook--------------------------------------------------> callAll(onHookRegistered
 *                                       Scene-------------------------------------------------> callAll(onSceneTransition
 *                                       
 * Emit the whole 'page'      > callAll(storyPage
 *                                          |
 *                                       Boxtext-----------------------------------------------> callAll(onBoxText
 *                                       
 * Emit the choices           > callAll(storyChoices
 *                                         |
 *                                       Hook--------------------------------------------------> callAll(onHookRegistered
 * 
 * Save the session somewhere > callAll(stateSave
 */

export async function continueSession(sessionData, choiceIndex=null) {

    // Reload the session
    var inkStory = await FoundryInk.loadStory(sessionData.sourcefile);
    if (sessionData.state !== null) {
        inkStory.state.LoadJson(sessionData.state);
    }
    Hooks.callAll('foundry-ink.loadSession', sessionData);

    // Rebind the default external bindings if enabled
    if (game.settings.get("foundry-ink", "useDefaultBindings")) {
        bindFunctions(inkStory);
        /** Allow modules to bind external functions when the story is being re-instantiated */
        await Hooks.callAll("foundry-ink.bindExternalFunctions", inkStory, sessionData);
    }

    // Prepare a 'page' to hold all lines delivered by ink
    var page = { frames: [], choices: [] };

    // If a choice is being made, do it first
    if (choiceIndex !== null) {
        inkStory.ChooseChoiceIndex(choiceIndex);
    }

    // Deliver one line at a time for parsing reasons
    while (inkStory.canContinue) {

        // Deliver line & ensure sessionData is up to date
        var line = inkStory.Continue();
        sessionData.state = inkStory.state.toJson();
        Hooks.callAll('foundry-ink.deliverLine', line, sessionData);

        // Deliver tags
        var tags = inkStory.currentTags;
        Hooks.callAll('foundry-ink.currentTags', tags, sessionData);

        // Deliver frame (line + tags)
        var frame = { line: line, tags: tags};
        Hooks.callAll('foundry-ink.deliverFrame', frame, sessionData);
        page.frames.push(frame);
    }

    // Collect and deliver choices. Now the story is either presenting choices or `-> END`
    page.choices = Object.entries(inkStory.currentChoices).map(choice => {
        return {
            index: choice[0],
            text: choice[1].text
        }
    });
    Hooks.callAll('foundry-ink.deliverChoices', page.choices, sessionData);

    // Deliver page
    Hooks.callAll('foundry-ink.deliverPage', page, sessionData);
    
    // Warn developers that saving right now will cause bugs
    if (inkStory.state.callstackDepth > 1) {
        console.warn(FoundryInk.i18n('warnings.tunnel-saves'));
    }

    // Save and dispose session. Second parameter warns devs if saving would cause problems.
    // Issues can be evaded by tracking the last valid state + choices since then to 'replay' the story.
    sessionData.visited = false;
    Hooks.callAll('foundry-ink.saveSession', sessionData, inkStory.state.callstackDepth > 1);

}

/* parses out scripting syntax from choices
TODO: Tear out the hook parsing
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
}*/
