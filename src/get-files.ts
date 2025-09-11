/* `EventFile` represents a file returned from an event. */
export type EventFile = {
	/* The `File` returned from a file input or a drop event. */
	file: File;

	/* The `FileSystemFileEntry` associated to a `File`.
	This entry is only available when a directory is dragged and dropped
	and its files are read; it can be used to retrieve the `entry.fullPath`
	of a file to reconstruct the directory file structure.
	This entry may not be available in all browsers. */
	entry?: FileSystemFileEntry;
};

/**
`getFiles` returns the list of files from a `change` or `drop` Event.

@remarks
`getFiles` supports only the `change` event type on file inputs and the `drop` event type (`DragEvent`).
Calling `getFiles` with other types of events will return an empty list.

For directory drop events, `getFiles` relies on the `webkitGetAsEntry` API;
if this API is unavailable in the browser, `getFiles` will return an empty list.

@param event - The `change` or `drop` `Event` for which files should be retrieved.
@returns A list of `EventFile`s that contain the `File`s retrieved from an `Event`.

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
*/
export let getFiles = async (event: Event): Promise<EventFile[]> => {
	// Get the list of files from the `<input type="file" />` `change` event.
	if (event.type === "change") {
		return [...((event.target as HTMLInputElement | null)?.files ?? [])].map((file) => ({ file }));
	}

	// Get the list of files from the drag and drop `DragEvent`.
	if (event.type === "drop") {
		return (
			await Promise.all(
				// Get the data transfer items of kind `file` and read the files.
				[...((event as DragEvent).dataTransfer?.items ?? [])]
					.filter(({ kind }) => kind === "file")
					.map(itemToFiles),
			)
		).flat();
	}

	// Unsupported event, no files.
	return [];
};

let itemToFiles = async (item: DataTransferItem): Promise<EventFile[]> => {
	// Note: `webkitGetAsEntry` may not be available in all browsers.
	let entry = item.webkitGetAsEntry?.();

	// Note: `getAsFile` returns a non-null `File` even for directories.
	let file = item.getAsFile();

	// No entry or file for this item.
	if (!entry && !file) return [];

	// A file exists but not its entry; it could be a real file or a directory.
	if (!entry && file) return [{ file }];

	// A true file exists, return it with its entry.
	if (entry?.isFile && file) return [{ file, entry: entry as FileSystemFileEntry }];

	// Otherwise, try to get the files from the entries.
	return await entryToFiles(entry);
};

let entryToFiles = async (entry: FileSystemEntry | null | undefined): Promise<EventFile[]> => {
	// Entry is a single file.
	if (entry?.isFile) {
		return [await fileEntryToFile(entry as FileSystemFileEntry)];
	}

	// Entry is a directory.
	if (entry?.isDirectory) {
		return await dirEntryToFiles(entry as FileSystemDirectoryEntry);
	}

	// Unknown or null entry, no files.
	return [];
};

let fileEntryToFile = (entry: FileSystemFileEntry): Promise<EventFile> => {
	return new Promise((resolve, reject) => {
		entry.file((file) => {
			resolve({ file, entry });
		}, reject);
	});
};

let dirEntryToFiles = async (dirEntry: FileSystemDirectoryEntry): Promise<EventFile[]> => {
	let files: EventFile[] = [];

	// Loop until we read all directories.
	let dirEntries = [dirEntry];
	while (dirEntries.length) {
		// Loop until we read all entries in the current directory.
		let reader = dirEntries.pop()!.createReader();
		while (true) {
			// Read some entries from the directory.
			let entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
				reader.readEntries(resolve, reject);
			});

			// No more entries in this directory.
			if (!entries.length) break;

			// Handle found entries.
			for (let entry of entries) {
				if (entry.isFile) {
					files.push(await fileEntryToFile(entry as FileSystemFileEntry));
				} else if (entry.isDirectory) {
					dirEntries.push(entry as FileSystemDirectoryEntry);
				}
			}
		}
	}

	// Return directory files.
	return files;
};
