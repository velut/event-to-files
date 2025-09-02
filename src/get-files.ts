/**
`getFiles` returns the list of `File`s from a `change` or `drop` Event.
*/
export async function getFiles(event: Event): Promise<File[]> {
	// Get the list of files from the `<input type="files" />` `change` event.
	if (event.type === "change" && event.target && "files" in event.target) {
		return handleChangeEvent(event);
	}

	// Get the list of files from the drag and drop `DragEvent`.
	if (event.type === "drop" && "dataTransfer" in event) {
		return await handleDropEvent(event as DragEvent);
	}

	throw new Error(
		"event-to-files: unsupported event type; `getFiles` must be called with an event of type `change` or `drop`",
	);
}

function handleChangeEvent(event: Event): File[] {
	return [...((event.target as HTMLInputElement).files ?? [])];
}

async function handleDropEvent(event: DragEvent): Promise<File[]> {
	const items = [...(event.dataTransfer?.items ?? [])].filter(({ kind }) => kind === "file");
	const itemsFiles = await Promise.all(items.map(itemToFiles));
	return itemsFiles.flat();
}

async function itemToFiles(item: DataTransferItem): Promise<File[]> {
	// If the item is a single file, return the file.
	const file = item.getAsFile();
	if (file) return [file];

	// Try to get the files from the entries, this may not be available in all browsers.
	if ("webkitGetAsEntry" in item) {
		return await entryToFiles(item.webkitGetAsEntry());
	}

	// No files for this item.
	return [];
}

async function entryToFiles(entry: FileSystemEntry | null): Promise<File[]> {
	// No entry, no files.
	if (!entry) return [];

	// Entry is a single file.
	if (entry.isFile) {
		const file = await fileEntryToFile(entry as FileSystemFileEntry);
		return [file];
	}

	// Entry is a directory.
	if (entry.isDirectory) {
		return await dirEntryToFiles(entry as FileSystemDirectoryEntry);
	}

	// Should be unreachable.
	throw new Error("event-to-files: unsupported FileSystemEntry type");
}

async function fileEntryToFile(fileEntry: FileSystemFileEntry): Promise<File> {
	return await new Promise((resolve, reject) => {
		fileEntry.file(resolve, reject);
	});
}

async function dirEntryToFiles(dirEntry: FileSystemDirectoryEntry): Promise<File[]> {
	const files: File[] = [];

	// Loop until we read all directories.
	const dirEntries = [dirEntry];
	while (dirEntries.length) {
		// Loop until we read all entries in the current directory.
		const reader = dirEntries.pop()!.createReader();
		while (true) {
			// Read some entries from the directory.
			const entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
				reader.readEntries(resolve, reject);
			});

			// No more entries in this directory.
			if (!entries.length) break;

			// Handle found entries.
			for (const entry of entries) {
				if (entry.isFile) {
					const file = await fileEntryToFile(entry as FileSystemFileEntry);
					files.push(file);
					continue;
				}
				if (entry.isDirectory) {
					dirEntries.push(entry as FileSystemDirectoryEntry);
					continue;
				}
			}
		}
	}

	// Return directory files.
	return files;
}
