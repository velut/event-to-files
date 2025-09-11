import { expect, test } from "vitest";
import { fromAny } from "@total-typescript/shoehorn";
import { getFiles } from "./get-files";

test("handles unknown event", async () => {
	expect(await getFiles(fromAny({ type: "unknown" }))).toEqual([]);
});

test("handles `change` event without a target", async () => {
	expect(await getFiles(fromAny({ type: "change" }))).toEqual([]);
});

test("handles `change` event with target without files", async () => {
	expect(await getFiles(fromAny({ type: "change", target: {} }))).toEqual([]);
});

test("handles `drop` event without `dataTransfer`", async () => {
	expect(await getFiles(fromAny({ type: "drop" }))).toEqual([]);
});

test("handles `change` event with null files", async () => {
	expect(await getFiles(fromAny({ type: "change", target: { files: null } }))).toEqual([]);
});

test("handles `change` event with no files", async () => {
	expect(await getFiles(fromAny({ type: "change", target: { files: [] } }))).toEqual([]);
});

test("handles `change` event with one file", async () => {
	expect(await getFiles(fromAny({ type: "change", target: { files: [{ name: "foo" }] } })))
		.toMatchInlineSnapshot(`
			[
			  {
			    "file": {
			      "name": "foo",
			    },
			  },
			]
		`);
});

test("handles `change` event with multiple files", async () => {
	expect(
		await getFiles(
			fromAny({ type: "change", target: { files: [{ name: "foo" }, { name: "bar" }] } }),
		),
	).toMatchInlineSnapshot(`
		[
		  {
		    "file": {
		      "name": "foo",
		    },
		  },
		  {
		    "file": {
		      "name": "bar",
		    },
		  },
		]
	`);
});

test("handles `drop` event with null items", async () => {
	expect(await getFiles(fromAny({ type: "drop", dataTransfer: { items: null } }))).toEqual([]);
});

test("handles `drop` event with no items", async () => {
	expect(await getFiles(fromAny({ type: "drop", dataTransfer: { items: [] } }))).toEqual([]);
});

test("handles `drop` event with no file items", async () => {
	expect(
		await getFiles(fromAny({ type: "drop", dataTransfer: { items: [{ kind: "unknown" }] } })),
	).toEqual([]);
});

test("handles `drop` event with file item returning a null file", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
						},
					],
				},
			}),
		),
	).toEqual([]);
});

test("handles `drop` event with file item returning a file", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return { name: "foo" };
							},
						},
					],
				},
			}),
		),
	).toMatchInlineSnapshot(`
		[
		  {
		    "file": {
		      "name": "foo",
		    },
		  },
		]
	`);
});

test("handles `drop` event with file item returning a null entry", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return null;
							},
						},
					],
				},
			}),
		),
	).toEqual([]);
});

test("handles `drop` event with file item returning an unknown entry type", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return { isFile: false, isDirectory: false };
							},
						},
					],
				},
			}),
		),
	).toEqual([]);
});

test("rejects `drop` event with file item returning a file entry type that rejects", async () => {
	await expect(
		getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return {
									isFile: true,
									file(_: any, err: any) {
										err("error");
									},
								};
							},
						},
					],
				},
			}),
		),
	).rejects.toThrow();
});

test("handles `drop` event with file item returning a file entry", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return {
									isFile: true,
									file(ok: any, _: any) {
										ok({ name: "foo" });
									},
									fullPath: "/foo",
								};
							},
						},
					],
				},
			}),
		),
	).toMatchInlineSnapshot(`
		[
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "foo",
		    },
		  },
		]
	`);
});

test("handles `drop` event with file item returning a file for a directory entry", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return { name: "foo" };
							},
							webkitGetAsEntry() {
								return dirEntry([]);
							},
						},
					],
				},
			}),
		),
	).toEqual([]);
});

test("handles `drop` event with file item returning a file for a file entry", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return { name: "foo" };
							},
							webkitGetAsEntry() {
								return fileEntry("/foo");
							},
						},
					],
				},
			}),
		),
	).toMatchInlineSnapshot(`
		[
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "foo",
		    },
		  },
		]
	`);
});

test("rejects `drop` event with file item returning a directory entry that rejects when reading entries", async () => {
	await expect(
		getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return {
									isFile: false,
									isDirectory: true,
									createReader() {
										return {
											readEntries(_: any, err: any) {
												err("error");
											},
										};
									},
								};
							},
						},
					],
				},
			}),
		),
	).rejects.toThrow();
});

test("handles `drop` event with file item returning a directory entry that returns an empty directory", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return {
									isFile: false,
									isDirectory: true,
									createReader() {
										return {
											readEntries(ok: any, _: any) {
												ok([]);
											},
										};
									},
								};
							},
						},
					],
				},
			}),
		),
	).toEqual([]);
});

test("handles `drop` event with file item returning a directory entry that returns a single file", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return dirEntry([fileEntry("/foo")]);
							},
						},
					],
				},
			}),
		),
	).toMatchInlineSnapshot(`
		[
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "foo",
		    },
		  },
		]
	`);
});

test("handles `drop` event with file item returning a directory entry that returns nested files and directories", async () => {
	expect(
		await getFiles(
			fromAny({
				type: "drop",
				dataTransfer: {
					items: [
						{
							kind: "file",
							getAsFile() {
								return null;
							},
							webkitGetAsEntry() {
								return dirEntry([
									fileEntry("/foo"),
									dirEntry([
										fileEntry("/bar/bar.foo"),
										dirEntry([fileEntry("/bar/baz/bar.baz.foo")]),
									]),
									dirEntry([
										fileEntry("/qux/qux.foo"),
										dirEntry([fileEntry("/qux/moo/qux.moo.foo")]),
									]),
								]);
							},
						},
					],
				},
			}),
		),
	).toMatchInlineSnapshot(`
		[
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "foo",
		    },
		  },
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/qux/qux.foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "qux.foo",
		    },
		  },
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/qux/moo/qux.moo.foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "qux.moo.foo",
		    },
		  },
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/bar/bar.foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "bar.foo",
		    },
		  },
		  {
		    "entry": {
		      "file": [Function],
		      "fullPath": "/bar/baz/bar.baz.foo",
		      "isFile": true,
		    },
		    "file": {
		      "name": "bar.baz.foo",
		    },
		  },
		]
	`);
});

function fileEntry(fullPath: string) {
	const name = fullPath.split("/").pop()!;
	return {
		isFile: true,
		file(ok: any, _: any) {
			ok({ name });
		},
		fullPath,
	};
}

function dirEntry(entries: any[]) {
	let i = 0;
	return {
		isFile: false,
		isDirectory: true,
		createReader() {
			return {
				readEntries(ok: any, _: any) {
					if (i > 0) ok([]);
					ok(entries);
					i++;
				},
			};
		},
	};
}
