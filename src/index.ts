/**
This package exports an async function `getFiles` that returns
the list of `File`s retrieved from a `change` event on file inputs
or from a `drop` event when dragging and dropping files.

@example
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

@packageDocumentation
*/

export { getFiles, type EventFile } from "./get-files";
