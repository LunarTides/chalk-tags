import chalk, { type ChalkInstance } from "chalk";

let actuallyParse = true;

/**
 * Globally disable parsing chalk tags.
 *
 * @see {@link resumeTagParsing}
 */
export function stopTagParsing() {
	actuallyParse = false;
}

/**
 * Globally enable parsing chalk tags.
 *
 * @see {@link stopTagParsing}
 */
export function resumeTagParsing() {
	actuallyParse = true;
}

/**
 * Makes chalk tags automatically apply to the console functions.
 *
 * This will make the console.log, console.error, and console.warn functions automatically call {@link parseTags} on their arguments.
 */
export function applyTagsToConsole() {
	const oldConsole = {
		log: console.log.bind(console),
		error: console.error.bind(console),
		warn: console.warn.bind(console),
	};

	console.log = (...args) => oldConsole.log(parseTags(args.join(" ")));
	console.error = (...args) => oldConsole.error(parseTags(args.join(" ")));
	console.warn = (...args) => oldConsole.warn(parseTags(args.join(" ")));
}

/**
 * Parses chalk tags in `text`.
 *
 * @param text The text with chalk tags.
 *
 * @returns The resulting string with ansi codes.
 *
 * @example
 * // You can combined these with each other.
 * // Some of these tags may not be supported by all terminal emulators / consoles.
 * // The following terminals are tested:
 * // - Windows Terminal
 * // - Windows Command Prompt (doesn't support overline)
 * // - Windows Powershell (doesn't support overline)
 * // - Most of the popular Linux terminals (I can't test all of them)
 *
 * // Foreground
 * "[fg:][dark:]red", "[fg:][dark:]green", "[fg:][dark:]blue" // (The `fg` and `dark` are both optional. For example: `fg:blue`)
 *
 * // Background
 * "bg:red", "bg:green", "bg:blue"
 *
 * // Bright
 * "bright:red", "bright:green", "bright:blue"
 *
 * // Background Bright
 * "bg:bright:red", "bg:bright:green", "bg:bright:blue"
 *
 * // Special
 * "b[old]", "i[talic]", "underline", "overline" // Only the "b" in bold and "i" in italic are required.
 *
 * // Hex
 * "[fg:]#FF0000", "bg:#FF0000"
 *
 * // -------------------------
 *
 * const parsed = parseTags("<b>Bold</b> Normal");
 * assert.equal(parsed, `${chalk.bold("Bold")} Normal`);
 *
 * // Add the `~` character to escape the tag.
 * const parsed = parseTags("~<b>Not Bold~</b> Fine ~~<b>Bold~~</b> Normal");
 * assert.equal(parsed, `<b>Not Bold</b> Fine ~${chalk.bold("Bold~")} Normal`);
 *
 * // You can mix and match tags as much as you want. You can remove categories of tags as well, for example, removing `bg:bright:blue` by doing `</bg>`.
 * const parsed = parseTags("<red bg:bright:blue bold>Test</bg> Hi</b> there</red> again");
 * assert.equal(parsed, `${chalk.bold.bgBlueBright.red("Test")}${chalk.bold.red(" Hi")}${chalk.red(" there")} again`);
 *
 * // Try to not use "</>" if you can help it. In this case, it is fine.
 * const parsed = parseTags("<fg:red italic bg:#0000FF>Test</> Another test");
 * assert.equal(parsed, `${chalk.bgHex("#0000FF").italic.red("Test")} Another test`);
 *
 * // If you pass in an invalid tag, it will remove the tag, but the tag will be ignored.
 * const parsed = parseTags("Fine <red>Red</red> <blargle>Blargle</blargle>");
 * assert.equal(parsed, `Fine ${chalk.red("Red")} Blargle`);
 * // ^ This can be prevented by using the `stopTagParsing` function.
 * stopTagParsing();
 * const parsed = parseTags("Fine <red>Red</red> <blargle>Blargle</blargle>");
 * assert.equal(parsed, "Fine <red>Red</red> <blargle>Blargle</blargle>");
 * // ^ As you can see, this will also stop the "<red>" tag from being applied. You need to make a tradeoff here.
 */
export function parseTags(text: string): string {
	if (!actuallyParse || !text.includes("<")) {
		return text;
	}

	let result = "";
	let currentTags: string[] = [];

	// PERF: This probably the slowest thing in the library. Maybe there is a better way to do this that doesn't use regex.
	for (const match of text.matchAll(/(.*?)(<.*?>|$)/gs)) {
		const [content, tagString] = handleEscape(match);

		if (content) {
			result += applyChalk(content, currentTags);
		}

		if (tagString?.startsWith("<")) {
			let remove = false;

			for (const tag of tagString.split(" ")) {
				if (remove || tag.startsWith("</")) {
					remove = true;

					const tagName = tag.replace("</", "").replace(">", ""); // Remove "</" and ">"
					currentTags = currentTags.filter((t) => !t.startsWith(tagName));
				} else {
					currentTags.push(tag.replace("<", "").replace(">", "")); // Remove < and >
				}
			}
		}
	}

	return result;
}

function applyChalk(text: string, tags: string[]): string {
	return tags.reduce((styledText, _tag) => {
		let tag = _tag;

		const isBackground = tag.includes("bg:");
		const isBright = tag.includes("bright:");

		// Clean up the tag.
		// PERF: I'm not using regex here because it's faster.
		tag = tag
			.replace("fg:", "")
			.replace("bg:", "")
			.replace("bright:", "")
			.replace("dark:", "");

		// Handle special tags.
		switch (tag) {
			case "b":
				tag = "bold";
				break;
			case "i":
				tag = "italic";
				break;
		}

		// Hex color support
		if (tag.startsWith("#")) {
			return isBackground
				? chalk.bgHex(tag)(styledText)
				: chalk.hex(tag)(styledText);
		}

		// Format chalk method
		let chalkMethod = isBackground ? `bg${capitalize(tag)}` : tag.toLowerCase();
		if (isBright) chalkMethod += "Bright";

		const chalkFunc = chalk[chalkMethod as keyof ChalkInstance] as unknown;
		return chalkFunc instanceof Function
			? (chalkFunc as (...text: unknown[]) => string)(styledText)
			: styledText;
	}, text);
}

function handleEscape(match: RegExpMatchArray): [string, string] {
	let [_, content, tag] = match;

	if (content.startsWith("~~") || content.endsWith("~~")) {
		/*
		 * Get rid of one of the escape characters.
		 * This will make it so "~~<b>" -> "~<b>" instead of "~~<b>" -> "~~<b>",
		 * and "~~~<b>" -> "~~<b>" instead of "~~~<b>" -> "~~~<b>".
		 * This makes it in-line with "~<b>" -> "<b>".
		 */
		content = content.replace("~", "");

		return [content, tag];
	}

	if (content === "~") {
		/*
		 * The content is just the escape character itself.
		 * This happens at the start of an escape (e.g. "~<b>Some text...")
		 * Replace it with the tag.
		 */
		content = tag;
		tag = "";
	} else if (content.endsWith("~") && tag.startsWith("<")) {
		/*
		 * The content ends with an escape character.
		 * This happens at the end of an escape (e.g. "...Some text~</b>")
		 * Append the tag to the content.
		 */
		content = content.replace("~", "") + tag;
		tag = "";
	}

	return [content, tag];
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
