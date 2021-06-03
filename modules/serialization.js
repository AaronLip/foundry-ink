/**
 * Implements serialization and deserialization logic for persisting story
 * data, bindings, and event listeners when users refresh foundry.
 * 
 * @module serde
 */

/**
 * SessionData Information about the user's session with the inkjs interpreter. Contains
 * data required to reboot the story.
 * 
 * @property {String} state - a JSON save-file produced by
 *     `inkjs.Story.state.toJson()`.
 * @property {String} sourcefile - the path (url, relative, absolute) at which
 *     the ink story's compiled .json file is located.
 * @property {boolean} visited - whether users have made choices and progressed
 *     beyond this story state.
 */ 
export class SessionData {

    /**
     * Converts a data object into a {@link serde.SessionData}.
     * 
     * @param {SessionData} data - the content to be wrapped by {@link serde.SessionData}
     * @param {String} data.state - a JSON save-file produced by
     *     `inkjs.Story.state.toJson()`.
     * @param {String} data.sourcefile - the path (url, relative, absolute) at
     *     which the ink story's compiled .json file is located.
     * @param {boolean} data.visited - whether users have made choices and
     *     progressed beyond this story state.
     */
    constructor(data) {
        Object.assign(this, data);
    }

    /**
     * Serializes ink session data into a flag for a foundry object. This is
     * necessary in order to reboot the ink interpreter when users reboot or
     * refresh foundry but wish to continue a story.
     * 
     * @param {FlaggableObject} flaggable - the object that implements foundry's
     *     setFlag interface.
     */
    toFlag(flaggable) {
        flaggable.setFlag('foundry-ink', 'session', this);
    }

    /**
     * Retrieves ink session data from a flag, allowing the users choices to resume
     * a story that was in progress before a refresh.
     * 
     * @param {FlaggableObject} flaggable - the object that implements foundry's
     *     getFlag interface.
     * @returns {SessionData} SessionData - the session data that was stored in
     *     a flag.
     */
    static fromFlag(flaggable) {
        return new this(flaggable.getFlag('foundry-ink', 'session'));
    }

}

/**
 * Information about a hook registered by text, bindings, or tags in the ink
 * story. Contains data required to reregister the hook after foundry reboots
 * or refreshes.
 * 
 * @property {String} triggerHook - the hook that will run the story's
 *     callback.
 * @property {String} hookType - one of 'once', 'when', or 'until'.
 * @property {SessionData} sessionData - information about the session
 *     that will be made accessible to the hook when called.
 * @property {Function} callbackFn - the callback to be serialized
 *     (deserializing this is effectively `eval` running at the privilege
 *     of a macro).
 */
export class HookData {

    /**
     * Converts a data object into a {@link serde.HookData}.
     * 
     * @param {HookData} data - the content to be wrapped by {@link serde.HookData}
     * @param {String} data.triggerHook - the hook that will run the story's
     *     callback.
     * @param {String} data.hookType - one of 'once', 'when', or 'until'.
     * @param {SessionData} data.sessionData - information about the session
     *     that will be made accessible to the hook when called.
     * @param {Function} data.callbackFn - the callback to be serialized
     *     (deserializing this is effectively `eval` running at the privilege
     *     of a macro).
     */
    constructor(data) {
        Object.assign(this, data);

        /**
         * Serialize a javascript function into a string so that it can survive
         * a reload.
         */
        var bakedFn = ((...args) => this.callbackFn(...args)).toString();
        this.callbackFn = `'use strict';return (${bakedFn})();`;
    }

    /**
     * Serializes hook data into a flag for a foundry object. This is necessary
     * because hooks do not persist when foundry reboots or refreshes.
     * 
     * @param {FlaggableObject} flaggable - the object that implements foundry's
     *     setFlag interface.
     */
    toFlag(flaggable) {
        flaggable.setFlag('foundry-ink', 'hook', this);
    }

    /**
     * Retrieves hook data from a flag, allowing event listeners to be reregistered
     * when the user reboots or refreshes foundry.
     * 
     * @param {FlaggableObject} flaggable - the object that implements
     *     foundry's setFlag interface.
     * @returns {HookData} hookData - the hook that was stored in a flag.
     */
    fromFlag(flaggable) {
        return new this(flaggable.getFlag('foundry-ink', 'hook'));
    }

}

/**
 * Serializes external binding data into a flag for a foundry object. This is
 * necessary because external bindings created by macros or through console
 * commands do not persist when foundry is rebooted or refreshed.
 * 
 * @param {FlaggableObject} flaggable - the object that implements foundry's
 *     setFlag interface.
 * @param {BindingData} bindingData - the external binding to be stored in a
 *     flag.
 */
export function saveExternalBindingToFlag(flaggable, bindingData) {
    flaggable.setFlag('foundry-ink', 'binding', bindingData);
}

/**
 * Retrieves external binding data, allowing ink's FFI external bindings to be
 * reregistered when a story needs to resume. 
 * 
 * @see {@link saveExternalBindingToFlag} creates the flags accessed by this
 *     function
 * @param {FlaggableObject} flaggable - the object that implements foundry's
 *     setFlag interface.
 * @returns {BindingData} bindingData - the external binding stored in a
 *     flag.
 */
export function loadExternalBindingFromFlag(flaggable, bindingData) {
    return flaggable.getFlag('foundry-ink', 'binding');
}