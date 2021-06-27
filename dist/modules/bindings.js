/**
 * Binds a small standard library of helpful external functions so that ink
 * stories can interact with foundry. These must be declared at the top of your
 * ink script using the `EXTERNAL` statement.
 * 
 * Even with Bind Foundry External Functions enabled in Module Settings, you
 * cannot use these external functions without an `EXTERNAL` statement. A
 * benefit of this behaviour is that you can only declare the functions you
 * want to use, and can create functions with the names of the others *(for
 * example, you might write `=== function ROLL(die) ===` instead of using
 * rolls from foundry.)*
 * 
 * @module bindings
 * @see [EXTERNAL Functions](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#external-functions)
 */
export function bindFunctions(inkStory) {

    /**
     * Binds to foundry's rolling API, allowing ink to get roll results as an integer total.
     * 
     * @function ROLL
     * @param {String} formula - the dice formula to roll.
     * 
     * @see [Basic Dice Rolling](https://foundryvtt.com/article/dice/)
     * @see [Advanced Dice Rolling](https://foundryvtt.com/article/dice-advanced/)
     * @see [Dice Modifiers](https://foundryvtt.com/article/dice-modifiers/)
     */
    inkStory.BindExternalFunction('ROLL', (formula) => (new Roll(formula)).roll().total);

    /**
     * Queries properties of an actor.
     * 
     * @function ACTOR
     * @param {String} name - the name of the actor to access.
     * @param {String} propertyString - the property key locating the desired
     *     value in Actor.data. `"a.b.c"` would return
     *     `Actor.data["a"]["b"]["c"]`.
     * 
     * @see [getProperty Helper](https://foundryvtt.com/api/module-helpers.html#.getProperty)
     */
    inkStory.BindExternalFunction('ACTOR', (name, propertyString) => queryEntityDataFromDirectory(ActorDirectory, name, propertyString));

    /**
     * Queries properties of an item.
     * 
     * @function ITEM
     * @param {String} name - the name of the item to access.
     * @param {String} propertyString - the property key locating the desired
     *     value in Item.data. `"a.b.c"` would return
     *     `Item.data["a"]["b"]["c"]`.
     * 
     * @see [getProperty Helper](https://foundryvtt.com/api/module-helpers.html#.getProperty)
     */
    inkStory.BindExternalFunction('ITEM', (name, propertyString) => queryEntityDataFromDirectory(ItemDirectory, name, propertyString));

    /**
     * Runs a Macro in foundry. While testing, it seemed that inkjs may not
     * perfectly implement ink's external API, so your macro may be called
     * prospectively. It may be triggered multiple times *before* that part of
     * your story is displayed to the players. As such, I recommend you have
     * some code to prevent it from being called at inappropriate times.
     * 
     * @function MACRO
     * @param {String} name - the name of the macro to execute.
     */
    inkStory.BindExternalFunction('MACRO', (name) => {
        var macro = getEntityFromDirectory(MacroDirectory, name);
        console.info(game.i18n.format('foundry-ink.templates.general', {
            header: game.i18n.localize('foundry-ink.title'),
            body: game.i18n.localize('foundry-ink.info.macro.run')
        }));

        (async () => await macro?.execute())();
        return macro !== undefined;
    }, false);

    /**
     * Switches scenes in foundry. While testing, it seemed that inkjs may not
     * perfectly implement ink's external API, so your scene might switch
     * before that part of your story is displayed to the players. This will be
     * observed further until the bug is confirmed resolved.
     * 
     * @function SCENE
     * @param {String} name - the name of the scene to activate.
     * 
     * @see [lookAheadSafe](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#actions--vs-pure-functions)
     */
    inkStory.BindExternalFunction('SCENE', (name) => {
        var scene = getEntityFromDirectory(SceneDirectory, name);

        scene.view();
        (async () => await scene.activate())();
        return scene !== undefined;
    }, false);

    /**
     * Preloads a scene in foundry. Using this in an earlier knot or stitch
     * before SCENE will ensure even players with slow computers switch at
     * about the same time as you.
     * 
     * @function PRELOAD
     * @param {String} name - the name of the scene to preload.
     */
    inkStory.BindExternalFunction('PRELOAD', (name) => {
        var scene = getEntityFromDirectory(SceneDirectory, name);

        (async () => await SceneDirectory.collection.preload(scene.id, true))();
        return scene !== undefined;
    }, false);

    /**
     * Loads the raw content of a journal entry (including html tags).
     * Rendering that html is not easy, due to `renderTemplate` requiring
     * const arguments.
     * 
     * @function JOURNAL
     * @param {String} name - the name of the scene to activate.
     * 
     * @see [lookAheadSafe](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#actions--vs-pure-functions)
     */
    inkStory.BindExternalFunction('JOURNAL', (name) => {
        var journal = getEntityFromDirectory(JournalDirectory, name);

        return journal?.data.content;
    });
}

function getEntityFromDirectory(directoryObject, name) {
    var entity = directoryObject.collection.getName(name);
    if (entity === undefined) {
        bindingErr(directoryObject.name, 'Access Binding', 'errors.not-found', {
            name: name
        });
    }
    return entity;
}

function queryEntityDataFromDirectory(directoryObject, name, propertyString) {
    var entity = directoryObject.collection.getName(name);
    if (entity === undefined) {
        bindingErr(directoryObject.name, 'Query Binding', 'errors.not-found', {
            name: name
        });
        return entity;
    }

    var data = entityDataAsInkType(entity, propertyString);

    if (data === null) {
        bindingErr(directoryObject.name, 'Query Binding', 'not-inkjs-type', {
            key: `${name}.data.${propertyString}`,
            value: getProperty(entity, 'data.' + propertyString)
        });
    }

    return data;
}

function entityDataAsInkType(entity, propertyString) {
    var property = getProperty(entity, 'data.' + propertyString);

    if (!['number', 'boolean', 'string'].some(t => typeof(property) === t)) {
        return null;
    } else {
        return property;
    }
}

function bindingErr(binding, cause, errMessage, formatObj={}) {
    console.error(FoundryInk.i18n('templates.issue', {
        header: FoundryInk.i18n('title'),
        cause: FoundryInk.i18n('templates.binding', {
            binding: binding,
            cause: cause
        }),
        body: FoundryInk.i18n(errMessage, formatObj)
    }));
}