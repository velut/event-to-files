/* `EventFile` represents a file returned from an event. */
export type EventFile = {
	/* The `File` returned from a files input or a drop event. */
	file: File;

	/* The `FileSystemFileEntry` associated to a `File`.
	This entry is only available when a directory is dragged and dropped
	and its files are extracted; it can be used to retrieve the `entry.fullPath`
	of a file to reconstruct the directory file structure.
	This entry may not be available in all browsers. */
	entry?: FileSystemFileEntry;
};

/**
`getFiles` returns the list of `File`s from a `change` or `drop` Event.
*/
export let getFiles = async (event: Event): Promise<EventFile[]> => {
	// Get the list of files from the `<input type="files" />` `change` event.
	if (event.type === "change") {
		return [...((event.target as HTMLInputElement | null)?.files ?? [])].map((file) => ({ file }));
	}

	// Get the list of files from the drag and drop `DragEvent`.
	if (event.type === "drop") {
		return (
			await Promise.all(
				// Get the data transfer items of kind `file`.
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
	// If the item is a single file, return the file.
	let file = item.getAsFile();
	if (file) return [{ file }];

	// Otherwise, try to get the files from the entries.
	// Note: `webkitGetAsEntry` may not be available in all browsers.
	return await entryToFiles(item.webkitGetAsEntry?.());
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
