import '../modules/ink.js';
import { DebugInterface, ChatInterface } from '../modules/interfaces.js';

Hooks.once("init", function() {
    console.log("IitF | Ink in the Foundry is initializing");
    window.FoundryInk = {
        DebugInterface,
        ChatInterface
    };
});

// Set up button listeners
Hooks.on("renderChatMessage", function(message, html, data) {

    if (message.getFlag('foundry-ink', 'visited')) {

        for (var choice of $(html).find('.ink-choice')) {
            $(choice).off('click');
            $(choice).prop('disabled', true);
        }

    } else {
        var currentChoices = $(html).find('.ink-choice:not(:disabled)');

        currentChoices.on('click', async function() {
            var message = game.collections.get("ChatMessage").get($(event.target).closest(".chat-message").data("messageId"));

            message.setFlag('foundry-ink', 'visited', true);

            Hooks.callAll(
                "foundry-ink.makeChoice",
                $(event.target).data('index'),
                message.getFlag('foundry-ink', 'sourcefile'),
                message.getFlag('foundry-ink', 'state'));
        });

    }
})

// This hook spins up an interpreter
Hooks.on("foundry-ink.makeChoice", async function(choiceIndex, sourcefile, state=null) {

    // Prepare a story instance
    var fink = await ChatInterface.loadStory(sourcefile);
    if (state !== null) {
        fink.inkStory.state.LoadJson(state);
    }

    // Consume remaining story chunks until a choice
    console.log("IitF | Call Depth:", fink.inkStory.state.callstackDepth);
    while (fink.inkStory.canContinue) {
        console.log("IitF | Text:", fink.inkStory.Continue());
    }
    console.log("IitF | Choices:", fink.inkStory.currentChoices);

    // Make the choice
    fink.inkStory.ChooseChoiceIndex(choiceIndex);
    fink.render();
})