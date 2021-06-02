export function registerSettings() {

    (async () => {
        await game.settings.register('foundry-ink', 'useDefaultBindings', {
            name: settingL10n('bindings-library.name'),
            hint: settingL10n('bindings-library.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        await game.settings.register('foundry-ink', 'chatRender', {
            name: settingL10n('chat-render.name'),
            hint: settingL10n('chat-render.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        await game.settings.register('foundry-ink', 'consoleRender', {
            name: settingL10n('console-render.name'),
            hint: settingL10n('console-render.hint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

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
    return game.i18n.localize(`foundry-ink.settings.${relativePath}`);
}