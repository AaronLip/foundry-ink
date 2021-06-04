/**
 * Provides a variety of different parsing tools for foundry ink. These assist
 * in converting story text into actions performed by foundry or by installed
 * modules.
 * 
 * @module parsing
 */

/**
 * Parses statements written in the form of `COMMAND (TYPE): ARGUMENT`. While
 * writing a script, it is common to use inline statements to tag character
 * dialogue, or to indicate scene/shot transitions. This syntax is intended for
 * the ink story to control foundry.
 * 
 * @param {String} text - the text to be parsed
 * @param {Object} [names={ command: 'command', type: 'type', argument: 'argument' }] -
 *     maps each of the regex groups to a name of your choosing, if
 *     specified.
 * @param {String} names.command - the name of the group that identifies the
 *     purpose of the text.
 * @param {String} names.type - the name of a group in parenthesis that
 *     provides additional information about the text, such as how an actor
 *     would say it, or what mood they are feeling.
 * @param {String} names.argument - the name of the group that the command and
 *     type operate on. This would ordinarily include an actor's dialogue,
 *     which scene to load, or filenames to prepare.
 *
 * @returns {undefined|Object} the result of parsing. When the parse has
 *     failed, this will be `undefined`. Otherwise, it will be an object
 *     containing a named field for each element in the `names` parameter. 
 */
export function parseInline(text, names={ command: 'command', type: 'type', argument: 'argument' }) {
    var regex = RegExp(`^(?<${names.command}>.+?)(\\s+\\((?<${names.type}>.+)\\))?\\s*:\\s+(?<${names.argument}>.+)$`);
    return text.trim().match(regex)?.groups;
}

/**
 * Parses statements written in the form of `INTERFACE>>DATA`. This syntax is
 * intended for use when the ink story needs to wait for foundry to do
 * something, such as fire a hook, before it is time to resume the story.
 * 
 * @param {String} text - the text to be parsed
 * @param {Object} [names={ interface: 'interface', data: 'data' }] - maps each
 *     of the regex groups to a name of your choosing, if specified.
 * @param {String} names.interface - the name of a group that identifies which
 *     of foundry's internals the story should communicate with.
 * @param {String} names.data - the name of a group that identifies the
 *     configuration data foundry will need to establish the communication
 *     channel.
 * 
 * @returns {undefined|Object} the result of parsing. When the parse has
 *     failed, this will be `undefined`. Otherwise, it will be an object
 *     containing a named field for each element in the `names` parameter. 
 */
export function parseInterface(text, names={ interface: 'interface', data: 'data' }) {
    var regex = RegExp(`^(?<${names.interface}>.+?)\\s*>>\\s*(?<${names.data}>.+)$`);
    return text.trim().match(regex)?.groups;
}

/**
 * Parses statements written in the form of `DATA--ALTTEXT`. This syntax is
 * intended for use when data contains some text to show in the ink story once
 * the data has been parsed out, so that text can be included in a compact
 * format.
 * 
 * @param {String} text - the text to be parsed
 * @param {Object} [names={ data: 'data', alttext: 'alttext' }] - maps each of
 *     the regex groups to a name of your choosing, if specified.
 * @param {String} names.data - the name of a group that identifies data to be
 *     dispatched for use by foundry.
 * @param {String} names.alttext - the name of a group that identifies what
 *     text to leave behind and emit through ink.
 * 
 * @returns {undefined|Object} the result of parsing. When the parse has
 *     failed, this will be `undefined`. Otherwise, it will be an object
 *     containing a named field for each element in the `names` parameter. 
 */
export function parseAltText(text, names={ data: 'data', alttext: 'alttext' }) {
    var regex = RegExp(`^(?<${names.data}>.+?)\\s*--\\s*(?<${names.alttext}>.+)$`);
    return text.trim().match(regex)?.groups;
}
