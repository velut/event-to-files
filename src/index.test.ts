import { expect, test } from "vitest";
import { getFiles } from "./index";

test("getFiles export is defined", () => {
	expect(getFiles).toBeDefined();
});
