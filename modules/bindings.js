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
        console.error(`Ink in the Foundry (${directoryObject.name} Access Binding) |`, `The entity "${name}" was not found. Make sure this name was not a typo!`);
    }
    return entity;
}

function queryEntityDataFromDirectory(directoryObject, name, propertyString) {
    var entity = directoryObject.collection.getName(name);
    if (entity === undefined) {
        console.error(`Ink in the Foundry (${directoryObject.name} Query Binding) |`, `The entity "${name}" was not found. Make sure this name was not a typo!`);
        return entity;
    }

    var data = entityDataAsInkType(entity, propertyString);

    if (data === null) {
        console.error(`Ink in the Foundry (${directoryObject.name} Query Binding) |`, `entity.data.${propertyString} returned a value inkjs cannot handle: ${property}`);
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