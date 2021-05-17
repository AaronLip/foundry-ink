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

    constructor(inkStory) {
        this.inkStory = inkStory;
    }

    static async loadStory(jsonFilename) {
        var f = await fetch(jsonFilename);
        var json = await f.text();
        var ifc = new ChatInterface(new inkjs.Story(json));
        ifc.sourcefile = jsonFilename;
        return ifc;
    }

    async run() {
        while (this.inkStory.canContinue) {
            await this.step(this.inkStory);
        }
    }

    async step() {
        ChatMessage.create({
            content: this.inkStory.ContinueMaximally(),
            speaker: {
                //actor: game.actors.getName("Blake"),
                alias: "Ink in the Foundry"
            },
            type: CONST.CHAT_MESSAGE_TYPES.IC
        });
        const html = await renderTemplate(
            "modules/foundry-ink/templates/choices.html",
            {
                choices: this.inkStory.currentChoices,
                state: this.inkStory.state.toJson(),
                sourcefile: this.sourcefile
            });

        var choices = $(document).find('#chat-log').find('.ink-choice');
        for (let choice of choices) {
            $(choice).off('click');
            $(choice).prop('disabled', true)
        }

        if (!this.inkStory.currentChoices.length > 0) {
            await ChatMessage.create({
                content: "THE END",
                speaker: {
                    //actor: game.actors.getName("Blake"),
                    alias: "Ink in the Foundry",
                },
                type: CONST.CHAT_MESSAGE_TYPES.IC
            });
        } else {
            await ChatMessage.create({
                content: html,
                speaker: {
                    //actor: game.actors.getName("Blake"),
                    alias: "Ink in the Foundry"
                },
                type: CONST.CHAT_MESSAGE_TYPES.IC
            });
            var currentChoices = $(document).find('#chat-log').find('.ink-choice:not(:disabled)');
            console.log(currentChoices);
            function closure(foundryInk) {
                return async function() {
                    foundryInk.inkStory.ChooseChoiceIndex($(event.target).data('index'));
                    console.log(foundryInk);
                    console.log($(event.target).data("state"));
                    await foundryInk.step();
                };
            };

            currentChoices.on('click', closure(this));
        }
    }

    toString() {
        return `FoundryInk.ChatInterface.${this.jsonFilename}`;
    }
}