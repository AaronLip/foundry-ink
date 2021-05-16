import '../modules/ink.js';
let f = await fetch("./modules/foundry-ink/ink-files/intercept.json");
let json = await f.text();

Hooks.on("ready", () => {
    console.log("ink in the foundry");
    var inkStory = new inkjs.Story(json);
    while (inkStory.canContinue) {
        step(inkStory);
    }
});

function step(inkStory) {
    console.log(inkStory.ContinueMaximally());
    for (var choice of inkStory.currentChoices) {
        console.log(choice.text);
    };
    if (inkStory.currentChoices.length > 0) {
        inkStory.ChooseChoiceIndex(0);
    } else {
        console.log("THE END");
    }
}