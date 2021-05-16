import '../modules/ink.js';
let f = await fetch("./modules/foundry-ink/intercept.json");
let json = await f.text();

Hooks.on("ready", () => {
    console.log("ink in the foundry");
    var inkStory = new inkjs.Story(json);
    console.log(inkStory.ContinueMaximally());
    console.log(inkStory.currentChoices);
});