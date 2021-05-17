export class DebugInterface {

    constructor(inkStory) {
        this.inkStory = inkStory;
    }

    static async loadStory(jsonFilename) {
        var f = await fetch(jsonFilename);
        var json = await f.text();
        return new DebugInterface(new inkjs.Story(json));
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
        return new ChatInterface(new inkjs.Story(json));
    }

    async run() {
        while (this.inkStory.canContinue) {
            await this.step(this.inkStory);
        }
    }

    async step() {
        ChatMessage.create({ content: this.inkStory.ContinueMaximally(), speaker: { alias: "Ink in the Foundry" } });
        const html = await renderTemplate(
            "modules/foundry-ink/templates/choices.html",
            { choices: this.inkStory.currentChoices });

        var choices = $(document).find('#chat-log').find('.ink-choice');
        for (let choice of choices) {
            $(choice).off('click');
            $(choice).prop('disabled', true)
        }

        if (!this.inkStory.currentChoices.length > 0) {
            await ChatMessage.create({ content: "THE END", speaker: { alias: "Ink in the Foundry" } });
        } else {
            await ChatMessage.create({ content: html, speaker: { alias: "Ink in the Foundry" } });
            var currentChoices = $(document).find('#chat-log').find('.ink-choice:not(:disabled)');
            console.log(currentChoices);
            function closure(foundryInk) {
                return async function() {
                    foundryInk.inkStory.ChooseChoiceIndex($(event.target).data('index'));
                    console.log(foundryInk);
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