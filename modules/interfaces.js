export class DebugInterface {

    constructor(inkStory) {
        this.inkStory = inkStory;
    }

    static async loadStory(jsonFilename) {
        var f = await fetch(jsonFilename);
        var json = await f.text();
        var ifc = new DebugInterface(new inkjs.Story(json));
        ifc.sourcefile = jsonFilename;
        return ifc;
    }

    run() {
        while (this.inkStory.canContinue) {
            this.step(this.inkStory);
        }
    }

    step() {
        console.log(this.inkStory.ContinueMaximally());
        for (var choice of this.inkStory.currentChoices) {
            console.log(choice.text);
        };
        if (this.inkStory.currentChoices.length > 0) {
            this.inkStory.ChooseChoiceIndex(0);
        } else {
            console.log("THE END");
        }
    }

    toString() {
        return `FoundryInk.DebugInterface.${this.jsonFilename}`;
    }
}

export class ChatInterface {

    /* new ChatInterface()
     * 
     * Wraps an ink runtime instance for use with ChatMessages
     */
    constructor(inkStory) {
        this.inkStory = inkStory;
    }

    /* ChatInterface.loadStory()
     *
     * Takes a filepath to a JSON file compiled for an ink runtime and loads it into `inkjs`, returning an instance of this wrapper class.
     */
    static async loadStory(jsonFilename) {
        var f = await fetch(jsonFilename);
        var json = await f.text();
        var ifc = new ChatInterface(new inkjs.Story(json));
        ifc.sourcefile = jsonFilename;
        return ifc;
    }

    async render() {

        var lines = [];
        while (this.inkStory.canContinue) {
            var line = this.inkStory.Continue();
            if (line && line !== '\n') {
                lines.push(line);
            }
        }

        const html = await renderTemplate(
        "modules/foundry-ink/templates/choices.html",
        {
            choices: this.inkStory.currentChoices,
            lines: lines
        });

        // Print "THE END" when the story is over
        if (!this.inkStory.currentChoices.length > 0) {
            await ChatMessage.create({
                content: lines.join(" ") + "\n\nTHE END",
                speaker: {
                    //actor: game.actors.getName("Blake"),
                    alias: "Ink in the Foundry",
                },
                type: CONST.CHAT_MESSAGE_TYPES.IC
            });
        } else {  // Otherwise, print the choices the user has
            let choicesMessage = await ChatMessage.create({
                content: html,
                speaker: {
                    //actor: game.actors.getName("Blake"),
                    alias: "Ink in the Foundry"
                },
                type: CONST.CHAT_MESSAGE_TYPES.IC
            });
            // Stash the state within the chat message for resume after leaving foundry
            await choicesMessage.setFlag('foundry-ink', 'state', this.inkStory.state.toJson());
            await choicesMessage.setFlag('foundry-ink', 'sourcefile', this.sourcefile);
            await choicesMessage.setFlag('foundry-ink', 'visited', false);
        }
    }

    toString() {
        return `FoundryInk.ChatInterface.${this.sourcefile}`;
    }
}