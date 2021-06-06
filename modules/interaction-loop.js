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

function continueSession(sessionData) {

    // Reload the session
    inkStory = FoundryInk.loadStory(sessionData.sourcefile);
    inkStory.state.loadJson(sessionData.state);
    Hooks.callAll('foundry-ink.loadSession', sessionData);

    // Prepare a 'page' to hold all lines delivered by ink
    var page = { lines: [], tags: [], choices: [] };

    // Deliver one line at a time for parsing reasons
    while (inkStory.canContinue) {

        // Deliver line
        var line = inkStory.Continue();
        page.lines.push(line);
        Hooks.callAll('foundry-ink.deliverLine', line);

        // Deliver tags
        page.tags.push(inkStory.currentTags);
        Hooks.callAll('foundry-ink.currentTags', inkStory.currentTags);
    }

    // Collect and deliver choices. Now the story is either presenting choices or `-> END`
    page.choices.concat(Object.entries(choices).map(choice => {
        return {
            index: choice[0],
            text: choice[1].text
        }
    }));
    Hooks.callAll('foundry-ink.deliverChoices', page.choices);

    // Deliver page
    Hooks.callAll('foundry-ink.deliverPage', page);
    
    // Warn developers that saving right now will cause bugs
    if (inkStory.state.callstackDepth > 1) {
        console.warn(FoundryInk.i18n('warnings.tunnel-saves'));
    }

    // Save and dispose session. Second parameter warns devs if saving would cause problems.
    // Issues can be evaded by tracking the last valid state + choices since then to 'replay' the story.
    Hooks.callAll('foundry-ink.saveSession', new serde.SessionData({
        state: inkStory.state.toJson(),
        sourcefile: sourcefile,
        visited: false
    }), inkStory.state.callstackDepth > 1);

}