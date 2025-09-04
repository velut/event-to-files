/**
`getFiles` returns the list of `File`s from a `change` or `drop` Event.
*/
export const getFiles = async (event: Event): Promise<File[]> => {
	// Get the list of files from the `<input type="files" />` `change` event.
	if (event.type === "change") {
		return [...((event.target as HTMLInputElement | null)?.files ?? [])];
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

const itemToFiles = async (item: DataTransferItem): Promise<File[]> => {
	return [
		// If the item is a single file, return the file.
		item.getAsFile() ??
			// Otherwise, try to get the files from the entries.
			// Note: `webkitGetAsEntry` may not be available in all browsers.
			(await entryToFiles(item.webkitGetAsEntry?.())),
	].flat();
};

const entryToFiles = async (entry: FileSystemEntry | null | undefined): Promise<File[]> => {
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

const fileEntryToFile = (fileEntry: FileSystemFileEntry): Promise<File> => {
	return new Promise((resolve, reject) => {
		fileEntry.file(resolve, reject);
	});
};

const dirEntryToFiles = async (dirEntry: FileSystemDirectoryEntry): Promise<File[]> => {
	let files: File[] = [];

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
