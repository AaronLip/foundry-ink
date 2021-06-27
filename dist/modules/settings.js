/**
 * Registers settings used by Ink in the Foundry, which can be accessed in the Module Settings tab of Foundry's Configure Settings Window.
 * 
 * @module settings
 */
export function registerSettings() {

    (async () => {
        /**
         * @member useDefaultBindings
         * @property {String} name - Bind Foundry External Functions
         * @property {String} hint - Enabling this lets you use some premade helper functions in your ink script. Declare them using the EXTERNAL keyword.
         * @proprty {Boolean} default - true
         */
        await game.settings.register('foundry-ink', 'useDefaultBindings', {
            name: settingL10n('bindings-library.name'),
            hint: settingL10n('bindings-library.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        /**
         * @member hookSyntax
         * @property {String} name - Use Hook Registration Syntax
         * @property {String} hint - Enabling this turns on hook syntax in the text of choices.
         * @property {Boolean} default - true
         */
        await game.settings.register('foundry-ink', 'hookSyntax', {
            name: settingL10n('hook-syntax.name'),
            hint: settingL10n('hook-syntax.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        /**
         * @member chatRender
         * @property {String} name - ChatMessage Renderer
         * @property {String} hint - Enabling this renderer will output ink stories to the chat window.
         * @property {Boolean} default - true
         */
        await game.settings.register('foundry-ink', 'chatRender', {
            name: settingL10n('chat-render.name'),
            hint: settingL10n('chat-render.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        /**
         * @member consoleRender
         * @property {String} name - Console Renderer
         * @property {String} hint - Enabling this renderer will output ink stories to the F12 debug console.
         * @property {Boolean} default - false
         */
        await game.settings.register('foundry-ink', 'consoleRender', {
            name: settingL10n('console-render.name'),
            hint: settingL10n('console-render.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        /**
         * @member dialogueSyntax
         * @property {String} name - Dialogue Indication Syntax
         * @property {String} hint - If your ink script uses a common syntax to indicate speakers of dialogue, then you can use this drop down to select it.
         * @property {String} default - None
         * 
         * @property {Array} choices - A dropdown selector
         * @property {String} choices.None - None
         * @property {String} choices.inline - Inline (`<SPEAKER>: ...`)
         * @property {String} choices.tag - Tag (`... #Dialogue: <SPEAKER>`)
         * 
         */
        await game.settings.register('foundry-ink', 'dialogueSyntax', {
            name: settingL10n('dialogue-syntax.name'),
            hint: settingL10n('dialogue-syntax.hint'),
            scope: 'world',
            config: true,
            type: String,
            default: settingL10n('dialogue-syntax.none'),
            choices: [settingL10n('dialogue-syntax.none'), settingL10n('dialogue-syntax.inline'), settingL10n('dialogue-syntax.tag')]
        });
    })();
}

function settingL10n(relativePath) {
    return FoundryInk.i18n(`settings.${relativePath}`);
}