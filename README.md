## Chalk Tags
This is a collection of functions that allows parsing HTML-style color tags.

```ts
import { parseTags, stopTagParsing, resumeTagParsing, applyTagsToConsole } from "chalk-tags";

console.log(parseTags("<red>Red text</red> Normal Text")); // (In red)Red text(In white) Normal Text

stopTagParsing();
console.log(parseTags("<red>Red text</red> Normal Text")); // <red>Red text</red> Normal Text

resumeTagParsing();
console.log(parseTags("<red>Red text</red> Normal Text")); // (In red)Red text(In white) Normal Text

console.log("<red>Red text</red> Normal Text"); // <red>Red text</red> Normal Text
applyTagsToConsole();
console.log("<red>Red text</red> Normal Text"); // (In red)Red text(In white) Normal Text

// Output is what you would expect.
console.log("<red bg:blue bold>Red and bold on blue background</bg> Red and Bold</bold> Red</red>");
console.log("<#FF0000 bg:#0000FF>Red on blue background</> White on black background");

// Look in the documentation for `parseTags` for a more detailed explanation and a list of the tags.
```

The npm package is [here](https://www.npmjs.com/package/chalk-tags).
Made with [chalk](https://github.com/chalk/chalk) ❤️
