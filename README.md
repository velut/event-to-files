# event-to-files

[![Build status](https://img.shields.io/github/actions/workflow/status/velut/event-to-files/main.yml?branch=main)](https://github.com/velut/event-to-files/actions?query=workflow%3ACI)
[![Coverage](https://img.shields.io/codecov/c/gh/velut/event-to-files)](https://codecov.io/gh/velut/event-to-files)
[![jsDocs.io](https://img.shields.io/badge/jsDocs.io-reference-blue)](https://www.jsdocs.io/package/event-to-files)
![Language](https://img.shields.io/github/languages/top/velut/event-to-files)
[![npm](https://img.shields.io/npm/v/event-to-files)](https://www.npmjs.com/package/event-to-files)
[![License](https://img.shields.io/github/license/velut/event-to-files)](https://github.com/velut/event-to-files/blob/main/LICENSE)

This package exports an async function `getFiles` that returns
the list of `File`s retrieved from a `change` event on file inputs
or from a `drop` event when dragging and dropping files.

## Features

- Compatible with `change` event on `<input type="file" />`
- Compatible with drag and drop of files and directories
- Returns standard web types (`File` and `FileSystemFileEntry`)
- Tiny: less than 1KB when minified
- ESM only package

## Useful resources

- [**Explore the API on jsDocs.io**](https://www.jsdocs.io/package/event-to-files)
- View package contents on [**unpkg**](https://unpkg.com/event-to-files/)
- View repository on [**GitHub**](https://github.com/velut/event-to-files)
- Read the changelog on [**GitHub**](https://github.com/velut/event-to-files/blob/main/CHANGELOG.md)

## Install

Using `npm`:

```
npm add event-to-files
```

Using `yarn`:

```
yarn add event-to-files
```

Using `pnpm`:

```
pnpm add event-to-files
```

Using `bun`:

```
bun add event-to-files
```

## Usage examples

```typescript
import { getFiles } from "event-to-files";

// For an `<input type="file" />`.
const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", async (event) => {
	event.preventDefault();
	const files = await getFiles(event);
	for (const { file } of files) {
		console.log(file.name);
	}
});

// For a drag and drop event.
const dropZone = document.getElementById("drop-zone");
dropZone.addEventListener("dragover", (event) => {
	// Cancel the `dragover` event to let the `drop` event fire later.
	event.preventDefault();
});
dropZone.addEventListener("drop", async (event) => {
	event.preventDefault();
	const files = await getFiles(event);
	for (const { file, entry } of files) {
		console.log(file.name);

		// If a directory was dragged and dropped,
		// we can get the file's full path in the directory.
		if (entry?.fullPath) {
			console.log(entry.fullPath);
		}
	}
});
```

## License

```
MIT
```

Copyright (c) 2025 Edoardo Scibona

See [LICENSE](./LICENSE) file.
