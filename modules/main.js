import '../modules/ink.js';
import { DebugInterface, ChatInterface } from '../modules/interfaces.js';

Hooks.once("init", function() {
    console.log("IitF | Ink in the Foundry is initializing");
    window.FoundryInk = {
        DebugInterface,
        ChatInterface
    };
});

Hooks.once("ready", function() {
    console.log("IitF | Ink in the Foundry is registering a chat log handler");
    for (let chatlog of $(document).find('#chat-log')) {
        chatlog.addEventListener('click', function() {
            if ($(event.target).hasClass('ink-choice')) {
                console.log($(event.target).data("index"));
                console.log($(event.target).data("source"));
            }
        });
    }
})