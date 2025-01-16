import { describe, expect, test } from "bun:test";
import { parseTags, resumeTagParsing, stopTagParsing } from "./index.ts";

describe("tags", () => {
	test("parse", async () => {
		expect(parseTags("No tags")).toEqual("No tags");

		expect(parseTags("No tags 01 <red>Red tag</red> No tags 02")).toEqual(
			"No tags 01 \x1b[31mRed tag\x1b[39m No tags 02",
		);

		expect(
			parseTags("<fg:red bg:dark:blue>Red & blue bg tag</bg> Red tag</fg>"),
		).toEqual(
			"\x1b[44m\x1b[31mRed & blue bg tag\x1b[39m\x1b[49m\x1b[31m Red tag\x1b[39m",
		);

		expect(parseTags("<b>Bold tag</b> No tags 02")).toEqual(
			"\x1b[1mBold tag\x1b[22m No tags 02",
		);

		expect(parseTags("<i>Italic tag</i> No tags 02")).toEqual(
			"\x1b[3mItalic tag\x1b[23m No tags 02",
		);

		expect(parseTags("<#123456 bg:bright:red>Green tag</> No tags")).toEqual(
			"\x1b[41m\x1b[38;2;18;52;86mGreen tag\x1b[39m\x1b[49m No tags",
		);

		expect(
			parseTags("<bg:#123456 fg:bright:red>Bg green tag</> No tags"),
		).toEqual(
			"\x1b[31m\x1b[48;2;18;52;86mBg green tag\x1b[49m\x1b[39m No tags",
		);

		expect(parseTags("~<bold>Hi~</bold>")).toEqual("<bold>Hi</bold>");

		expect(parseTags("<b>~<i>Bold tag~</i> Still bold</b>")).toEqual(
			"\x1b[1m<i>\x1b[22m\x1b[1mBold tag</i>\x1b[22m\x1b[1m Still bold\x1b[22m",
		);
	});

	test("stop and resume parsing", async () => {
		stopTagParsing();
		expect(parseTags("<red>Red tag</red> No tags")).toEqual(
			"<red>Red tag</red> No tags",
		);

		resumeTagParsing();
		expect(parseTags("<red>Red tag</red> No tags")).toEqual(
			"\x1b[31mRed tag\x1b[39m No tags",
		);
	});

	// I don't know how to test applyToConsole.
});
