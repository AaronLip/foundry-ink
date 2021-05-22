export function registerSettings() {

    (async () => {
        await game.settings.register("foundry-ink", "useDefaultBindings", {
            name: 'Bind Foundry External Functions',
            hint: 'Enabling this lets you use some premade helper functions in your ink script. Declare them using the EXTERNAL keyword.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        await game.settings.register('foundry-ink', 'chatRender', {
            name: 'ChatMessage Renderer',
            hint: 'Enabling this renderer will output ink stories to the chat window.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        await game.settings.register('foundry-ink', 'consoleRender', {
            name: 'Console Renderer',
            hint: 'Enabling this renderer will output ink stories to the F12 debug console.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        await game.settings.register('foundry-ink', 'dialogueSyntax', {
            name: 'Dialogue Indication Syntax',
            hint: 'If your ink script uses a common syntax to indicate speakers of dialogue, then you can use this drop down to select it.',
            scope: 'world',
            config: true,
            type: String,
            default: 'None',
            choices: ['None', '<SPEAKER>: ...', '... #Dialogue: <SPEAKER>']
        });
    })();
}