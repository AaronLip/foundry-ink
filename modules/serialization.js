/**
 * Serializes ink session data into a flag for an Entity (0.7.x) or Document
 * (0.8.x) object. This is necessary in order to reboot the ink interpreter
 * when users reboot or refresh foundry but wish to continue a story.
 * 
 * @param {FlaggableObject} flaggable - the object that implements foundry's
 *     setFlag interface.
 * @param {InkSessionData} inkSession - the session data to be stored in a
 *     flag.
 */
export function saveSessionToFlag(flaggable, inkSession) {
    flaggable.setFlag('foundry-ink', 'session', inkSession);
}

/**
 * Retrieves ink session data from a flag, allowing the users choices to resume
 * a story that was in progress before a refresh.
 * 
 * @see {@link saveSessionToFlag} creates the flags accessed by this
 * function.
 * 
 * @param {FlaggableObject} flaggable - the object that implements foundry's
 *     getFlag interface.
 * @returns {InkSessionData} inkSession - the session data stored in a flag.
 */
export function loadSessionFromFlag(flaggable) {
    return flaggable.getFlag('foundry-ink', 'session');
}

/**
 * Serializes hook data into a flag for an Entity (0.7.x) or Document (0.8.x)
 * object. This is necessary because hooks do not persist when foundry reboots
 * or refreshes.
 * 
 * @param {FlaggableObject} flaggable - the object that implements foundry's
 *     setFlag interface.
 * @param {HookData} hookData - the hook to be stored in a flag.
 */
export function saveHookToFlag(flaggable, hookData) {
    flaggable.setFlag('foundry-ink', 'hook', hookData);
}

/**
 * Retrieves hook data from a flag, allowing event listeners to be reregistered
 * when the user reboots or refreshes foundry.
 * 
 * @see {@link saveHookToFlag} creates the flags accessed by this function.
 * 
 * @param {FlaggableObject} flaggable - the object that implements foundry's
 *     setFlag interface.
 * @returns {HookData} hookData - the hook stored in a flag.
 */
export function loadHookFromFlag(flaggable) {
    return flaggable.getFlag('foundry-ink', 'hook');
}

/**
 * Serializes external binding data into a flag for an Entity (0.7.x) or
 * Document (0.8.x) object. This is necessary because external bindings created
 * by macros or through console commands do not persist when foundry is
 * rebooted or refreshed.
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