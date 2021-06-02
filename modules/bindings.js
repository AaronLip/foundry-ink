export function bindFunctions(inkStory) {

    // Helpful bindings
    inkStory.BindExternalFunction("ROLL", (formula) => (new Roll(formula)).roll().total);

    inkStory.BindExternalFunction("ACTOR", (name, propertyString) => queryEntityDataFromDirectory(ActorDirectory, name, propertyString));

    inkStory.BindExternalFunction("ITEM", (name, propertyString) => queryEntityDataFromDirectory(ItemDirectory, name, propertyString));

    inkStory.BindExternalFunction("MACRO", (name) => {
        var macro = getEntityFromDirectory(MacroDirectory, name);

        (async () => await macro.execute())();
        return macro !== undefined;
    });

    inkStory.BindExternalFunction("SCENE", (name) => {
        var scene = getEntityFromDirectory(SceneDirectory, name);

        scene.view();
        (async () => await scene.activate())();
        return scene !== undefined;
    });

    inkStory.BindExternalFunction("PRELOAD", (name) => {
        var scene = getEntityFromDirectory(SceneDirectory, name);

        (async () => await SceneDirectory.collection.preload(scene.id, true))();
        return scene !== undefined;
    });

    inkStory.BindExternalFunction("JOURNAL", (name) => {
        var journal = getEntityFromDirectory(JournalDirectory, name);

        return journal?.data.content;
    });
}

function getEntityFromDirectory(directoryObject, name) {
    var entity = directoryObject.collection.getName(name);
    if (entity === undefined) {
        console.error(errorL10n('binding', {
            binding: directoryObject.name,
            cause: "Access Binding",
            message: errorL10n('not-found', {
                name: name
            })
        }));
    }
    return entity;
}

function queryEntityDataFromDirectory(directoryObject, name, propertyString) {
    var entity = directoryObject.collection.getName(name);
    if (entity === undefined) {
        console.error(errorL10n('binding', {
            binding: directoryObject.name,
            cause: "Query Binding",
            message: errorL10n('not-found', {
                name: name
            })
        }));
        return entity;
    }

    var data = entityDataAsInkType(entity, propertyString);

    if (data === null) {
        console.error(errorL10n('binding', {
            binding: directoryObject.name,
            cause: "Query Binding",
            message: errorL10n('not-inkjs-type', {
                key: `entity.data.${propertyString}`,
                value: property
            })
        }));
    }

    return data;
}

function entityDataAsInkType(entity, propertyString) {
    var property = getProperty(entity, "data." + propertyString);

    if (!["number", "boolean", "string"].some(t => typeof(property) === t)) {
        return null;
    } else {
        return property;
    }
}

function errorL10n(relativePath, formatObj) {
    return game.i18n.format(`foundry-ink.errors.${relativePath}`, formatObj);
}