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

export async function continueSession(sessionData) {

    // Reload the session
    var inkStory = await FoundryInk.loadStory(sessionData.sourcefile);
    if (sessionData.state !== null) {
        inkStory.state.loadJson(sessionData.state);
    }
    Hooks.callAll('foundry-ink.loadSession', sessionData);

    // Rebind the default external bindings if enabled
    if (game.settings.get("foundry-ink", "useDefaultBindings")) {
        bindFunctions(inkStory);
    }

    // Prepare a 'page' to hold all lines delivered by ink
    var page = { frames: [], choices: [] };

    // Deliver one line at a time for parsing reasons
    while (inkStory.canContinue) {

        // Deliver line
        var line = inkStory.Continue();
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
    page.choices.concat(Object.entries(inkStory.currentChoices).map(choice => {
        return {
            index: choice[0],
            text: choice[1].text
        }
    }));
    Hooks.callAll('foundry-ink.deliverChoices', page.choices, sessionData);

    // Deliver page
    Hooks.callAll('foundry-ink.deliverPage', page, sessionData);
    
    // Warn developers that saving right now will cause bugs
    if (inkStory.state.callstackDepth > 1) {
        console.warn(FoundryInk.i18n('warnings.tunnel-saves'));
    }

    // Save and dispose session. Second parameter warns devs if saving would cause problems.
    // Issues can be evaded by tracking the last valid state + choices since then to 'replay' the story.
    Hooks.callAll('foundry-ink.saveSession', new serde.SessionData({
        state: inkStory.state.toJson(),
        sourcefile: sessionData.sourcefile,
        visited: false
    }), inkStory.state.callstackDepth > 1);

}