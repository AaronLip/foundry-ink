import '../modules/ink.js';
import { bindFunctions } from "./bindings.js";
import * as serde from '../modules/serialization.js';
import * as parsing from '../modules/parsing.js';

/**
 * Steps an inkStory forward, notifying any listeners by calling hooks to send them new data. 
 * 
 * @param {Object | serde.SessionData } sessionData - Information about the story being resumed
 * @param {String} sessionData.name - the name of the binding in ink by the when
 *     bound by the EXTERNAL command or called as a function.
 * @param {SessionData} sessionData.sessionData - information about the session
 *     that will be used to rebind the external function.
 * @param {Function} sessionData.externalFn - the binding to be serialized
 *     (deserializing this is effectively `eval` running at the privilege of a
 *     macro).
 * 
 * @fires foundry-ink.loadSession
 * @fires foundry-ink.bindExternalFunctions
 * @fires foundry-ink.deliverLines
 * @fires foundry-ink.currentTags
 * @fires foundry-ink.deliverFrame
 * @fires foundry-ink.deliverChoices
 * @fires foundry-ink.deliverPage
 * @fires foundry-ink.saveSession
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
    page.choices = choiceParse(inkStory.currentChoices, sessionData);
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

/* parses out scripting syntax from choices */
function choiceParse(choices, sessionData) {

    return Object.entries(choices).flatMap(choice => {
        var index = choice[0];
        var text = choice[1].text;

        var choiceContainer = {
            text: text,
            index: index
        };

        /* Attempt to parse the interface syntax, returning the choice text
         * unaltered if it did not contain an interface call
         */
        var parse = parsing.parseInterface(text);
        if (parse === undefined) {
            return [choiceContainer];
        }

        /* Handle a hooks interface call, parsing out additional information
         * such as the hook to create, or whether to display the choice to the
         * user via choicetext
         */
        if (parse.interface === "Hooks") {
            var dParse = parsing.parseAltText(parse.data, { data: 'hookname', alttext: 'choicetext' });
            var hook = {
                name: dParse?.hookname ?? parse.data,
                fn: () => continueSession(sessionData, index)
            };

            choiceContainer.text = dParse?.choicetext ?? parse.data;
            choiceContainer.hook = hook;
            Hooks.once(hook.name, hook.fn);
        }

        /* When hooks are registered with no alt text, alert the developer that
         * a choice won't appear.
         */
        if (dParse === undefined) {
            console.warn(FoundryInk.i18n('templates.issue', {
                header: FoundryInk.i18n('title'),
                cause: 'Hook parsing',
                body: FoundryInk.i18n('warnings.no-choicetext', {
                    name: parse.data
                })
            }));

            return [];
        }

        return [choiceContainer];
    });
}
