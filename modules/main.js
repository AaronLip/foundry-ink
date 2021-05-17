import '../modules/ink.js';
import { DebugInterface, ChatInterface } from '../modules/interfaces.js';

Hooks.once("init", function() {
    console.log("IitF | Ink in the Foundry is initializing");
    window.FoundryInk = {
        DebugInterface,
        ChatInterface
    };
});