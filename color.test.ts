import { describe, expect, test } from "bun:test";
import chalk from "chalk";
import { parseTags, resumeTagParsing, stopTagParsing } from "./index.ts";

describe("tags", () => {
	test("parse", async () => {
		expect(parseTags("No tags")).toEqual("No tags");

		expect(parseTags("No tags 01 <red>Red tag</red> No tags 02")).toEqual(
			`No tags 01 ${chalk.red("Red tag")} No tags 02`,
		);

		expect(
			parseTags("<fg:red bg:dark:blue>Red & blue bg tag</bg> Red tag</fg>"),
		).toEqual(
			`${chalk.bgBlue.red("Red & blue bg tag")}${chalk.red(" Red tag")}`,
		);

		expect(parseTags("<b>Bold tag</b> No tags 02")).toEqual(
			`${chalk.bold("Bold tag")} No tags 02`,
		);

		expect(parseTags("<i>Italic tag</i> No tags 02")).toEqual(
			`${chalk.italic("Italic tag")} No tags 02`,
		);

		expect(
			parseTags(
				"<#123456 bg:bright:red>Blue on bright red background</> No tags",
			),
		).toEqual(
			`${chalk.bgRedBright.hex("#123456")("Blue on bright red background")} No tags`,
		);

		expect(
			parseTags(
				"<bg:#123456 fg:bright:red>Bright red on blue background</> No tags",
			),
		).toEqual(
			`${chalk.redBright.bgHex("#123456")("Bright red on blue background")} No tags`,
		);

		expect(
			parseTags("<red bg:bright:blue bold>Test</bg> Hi</b> there</red> again"),
		).toEqual(
			`${chalk.bold.bgBlueBright.red("Test") + chalk.bold.red(" Hi") + chalk.red(" there")} again`,
		);

		expect(parseTags("<fg:red italic bg:#0000FF>Test</> Another test")).toEqual(
			`${chalk.bgHex("#0000FF").italic.red("Test")} Another test`,
		);

		expect(parseTags("<fg:red italic bg:#0000FF>Test</bg italic> Another test")).toEqual(
			`${chalk.bgHex("#0000FF").italic.red("Test")}${chalk.red(" Another test")}`,
		);

		expect(parseTags("~<bold>Hi~</bold>")).toEqual("<bold>Hi</bold>");

		expect(parseTags("<b>~<i>Bold tag~</i> Still bold</b>")).toEqual(
			// The unnecessary calls to chalk.bold is strange.
			// I'm not sure there is not much I can do about it without making the library needlessly complicated.
			`${chalk.bold("<i>")}${chalk.bold("Bold tag</i>")}${chalk.bold(" Still bold")}`,
		);

		expect(parseTags("~<b>Not Bold~</b> Fine ~~<b>Bold~~</b> Normal")).toEqual(
			`<b>Not Bold</b> Fine ~${chalk.bold("Bold~")} Normal`,
		);

		expect(parseTags("Fine ~~~<b>Bold~~~</b> Normal")).toEqual(
			`Fine ~~${chalk.bold("Bold~~")} Normal`,
		);

		expect(parseTags("Fine ~<b>Nomahl</b> Normal")).toEqual(
			"Fine <b>Nomahl Normal",
		);

		expect(parseTags("Fine <b>Bold~</b> Still bold")).toEqual(
			`Fine ${chalk.bold("Bold</b>")}${chalk.bold(" Still bold")}`,
		);

		expect(parseTags("Fine ~<b>Bold~~</b> Normal")).toEqual(
			"Fine <b>Bold~ Normal",
		);

		expect(parseTags("Fine ~~<b>Bold~</b> Normal")).toEqual(
			`Fine ~${chalk.bold("Bold</b>")}${chalk.bold(" Normal")}`,
		);
	});

	test("stop and resume parsing", async () => {
		stopTagParsing();
		expect(parseTags("<red>Red tag</red> No tags")).toEqual(
			"<red>Red tag</red> No tags",
		);

		resumeTagParsing();
		expect(parseTags("<red>Red tag</red> No tags")).toEqual(
			`${chalk.red("Red tag")} No tags`,
		);
	});

	// I don't know how to test applyToConsole.
});
