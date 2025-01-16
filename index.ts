import chalk, { type ChalkInstance } from "chalk";

let actuallyParse = true;

/**
 * Globally disable parsing color tags.
 *
 * @see {@link resumeTagParsing}
 */
export function stopTagParsing() {
	actuallyParse = false;
}

/**
 * Globally enable parsing color tags.
 *
 * @see {@link stopTagParsing}
 */
export function resumeTagParsing() {
	actuallyParse = true;
}

/**
 * Applies color tags to the console.
 *
 * This will make the console.log, console.error, and console.warn functions automatically call `parse` on their arguments.
 */
export function applyTagsToConsole() {
	const oldConsole = {
		log: console.log.bind(console),
		error: console.error.bind(console),
		warn: console.warn.bind(console),
	};

	console.log = (...args) => oldConsole.log(parseTags(args.join(" ")));
}

/**
 * Parses color tags in `text`.
 *
 * @example
 * // You can combined these with each other
 * // Many of these tags may not be supported by all terminal emulators / consoles.
 * // The following terminals are tested:
 * // Windows Terminal
 * // Windows Command Prompt (doesn't support overline)
 * // Windows Powershell (doesn't support overline)
 * // Most of the popular Linux terminals (I can't test all of them)
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
 * "b[old]", "i[talic]", "underline", "overline" // The `old` in bold and `talic` in italic are optional
 *
 * // Hex
 * "[fg:]#FF0000", "bg:#FF0000"
 *
 * @param text The text to parse
 *
 * @returns The resulting string
 *
 * @example
 * const parsed = parseTags("<b>Bold</b> Normal");
 * assert.equal(parsed, chalk.bold("Bold") + " Normal");
 *
 * @example
 * // Add the `~` character to escape the tag
 * const parsed = parseTags("~<b>Not Bold~</b> Fine ~~<b>Bold~~</b> Normal");
 * assert.equal(parsed, "<b>Not Bold</b> Fine ~" + chalk.bold("Bold~") + " Normal");
 *
 * @example
 * // You can mix and match tags as much as you want. You can remove categories of tags as well, for example, removing `bg:bright:blue` by doing `</bg>`
 * const parsed = parseTags("<red bg:bright:blue bold>Test</bg> Hi</b> there</red> again");
 * assert.equal(parsed, chalk.red.bgBlueBright.bold("Test") + chalk.red.bold(" Hi") + chalk.red(" there") + " again");
 *
 * @example
 * // Try to not use "</>" if you can help it. In this case, it is fine.
 * const parsed = parseTags("<fg:red italic bg:#0000FF>Test</> Another test");
 * assert.equal(parsed, chalk.red.italic.bgHex("#0000FF")("Test") + " Another test");
 */
export function parseTags(text: string): string {
	if (!actuallyParse || !text.includes("<")) {
		return text;
	}

	let result = "";
	let currentTags: string[] = [];

	for (const match of text.matchAll(/(.*?)(<.*?>|$)/gs)) {
		let [_, content = "", tag = ""] = match;

		[content, tag] = handleTildeCase(text, match, content, tag);

		if (content) {
			result += applyChalk(content, currentTags);
		}

		if (tag?.startsWith("<")) {
			const tags = tag.split(" ");

			for (const individualTag of tags) {
				if (individualTag.startsWith("</")) {
					const tagName = individualTag.slice(2, -1); // Remove "</" and ">"
					currentTags = currentTags.filter((t) => !t.startsWith(tagName));
				} else {
					currentTags.push(individualTag.replace(/[<>]/g, "")); // Remove < and >
				}
			}
		}
	}

	return result;
}

function applyChalk(text: string, tags: string[]): string {
	return tags.reduce((styledText, _tag) => {
		let tag = _tag;

		const isBackground = tag.startsWith("bg:");
		const isBright = tag.startsWith("bright:");

		// Clean up the tag and handle specific cases
		tag = tag.replace(/fg:|bg:|bright:|dark:/g, "");
		if (tag === "b") tag = "bold";
		if (tag === "i") tag = "italic";

		// Hex color support
		if (tag.startsWith("#")) {
			return isBackground
				? chalk.bgHex(tag)(styledText)
				: chalk.hex(tag)(styledText);
		}

		// Format chalk method
		let chalkMethod = isBackground ? `bg${capitalize(tag)}` : tag;

		if (isBright) chalkMethod += "Bright";

		const chalkFunc = chalk[chalkMethod as keyof ChalkInstance] as unknown;
		return chalkFunc instanceof Function
			? (chalkFunc as (...text: unknown[]) => string)(styledText)
			: styledText;
	}, text);
}

function handleTildeCase(
	text: string,
	match: RegExpMatchArray,
	_content: string,
	_tag: string,
): [string, string] {
	let content = _content;
	let tag = _tag;

	if (/(^~~|~~$)/g.test(content)) {
		return [content, tag];
	}

	// Handle cases where content starts or ends with tilde (~)
	if (text[match.index ?? -1] === "~") {
		content = tag; // The content is actually the tag here
		tag = "";
	} else if (content.endsWith("~") && tag.startsWith("<")) {
		content = content.replace(/~$/, "") + tag; // Append the tagc to the content if content ends with "~"
	}

	return [content, tag];
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
