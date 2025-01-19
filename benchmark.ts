import { bench, run } from "mitata";
import { parseTags } from ".";

bench("parseTags - default, red, default", () =>
	parseTags("No tags 01 <red>Red tag</red> No tags 02"),
);
bench("parseTags - bold red, bold, default", () =>
	parseTags("<bold red>Red & Bold</red> Bold</bold> Default"),
);
bench("parseTags - hex, default", () => parseTags("<#123456>Blue</> Default"));
bench("parseTags - everything", () =>
	parseTags(
		"<#123456 bg:bright:red bold italic underline overline>Everything</italic> Less</bold> Less</underline> Less</overline> Less</bg> Less</> Less",
	),
);

await run();
