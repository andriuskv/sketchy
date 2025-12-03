let thumbs: {
  [name: string]: {
    url?: string;
    blob?: Blob;
    loading: boolean;
    worker?: Worker;
  }
} = {};

let preloaded: { [name: string]: string } = {};
let imageDimensions: { [name: string]: { width: number, height: number } } = {};

function preloadImage(image: Image) {
  if (preloaded[image.name]) {
    return preloaded[image.name];
  }
  const url = URL.createObjectURL(image.file);
  preloaded[image.name] = url;

  const img = new Image();
  img.src = url;
  return preloaded[image.name];
}

function getPreloadedImage(name: string) {
  return preloaded[name];
}

function setImageDimensions(name: string, width: number, height: number) {
  imageDimensions[name] = { width, height };
}

function getImageDimensions(name: string) {
  return imageDimensions[name];
}

function resetImageDimensions() {
  imageDimensions = {};
}

function cleanupPreloadedImages() {
  for (const name in preloaded) {
    URL.revokeObjectURL(preloaded[name]);
  }
  preloaded = {};
}

function isSupportedMimeType(type: string) {
  return type.startsWith("image");
}

async function readItems(items: DataTransferItemList, uploadedItems: Image[] = []) {
  const filePromises = [];
  const directoryPromises = [];

  for (const item of items) {
    if (item.kind === "file" && (item.type === "" || isSupportedMimeType(item.type))) {
      const entry = item.webkitGetAsEntry()!;

      if (entry.isDirectory) {
        directoryPromises.push(readDirectory(entry as FileSystemDirectoryEntry));
      }
      else if (entry.isFile) {
        filePromises.push(readFile(entry as FileSystemFileEntry));
      }
    }
  }

  const resolvedItems = await Promise.all([...directoryPromises, ...filePromises]);
  let files: File[] = [];

  for (const item of resolvedItems) {
    if (Array.isArray(item)) {
      files = files.concat(item);
    }
    else {
      files.push(item);
    }
  }
  return getUniqueImages(files, uploadedItems);
}

function getUniqueImages(files: File[], images: Image[]) {
  const newImages: Image[] = [];
  let index = images.length;

  for (const file of files) {
    newImages.push({
      index,
      file,
      name: file.name,
      date: file.lastModified,
      size: file.size,
      selected: true
    });
    index += 1;
  }

  return removeDuplicates(newImages, images);
}

function removeDuplicates<T>(newItems: (T & { name: string })[], existingItems: Image[]): T[] {
  return newItems.filter(newItem => !existingItems.some(existingItem => existingItem.name === newItem.name));
}

function readDirectory(directory: FileSystemDirectoryEntry): Promise<File[]> {
  return new Promise(resolve => {
    const reader = directory.createReader();
    const items: File[] = [];

    function readEntries() {
      reader.readEntries(async entries => {
        if (entries.length > 0) {
          for (const entry of entries) {
            if (entry.isFile) {
              const file = await readFile(entry as FileSystemFileEntry);

              if (isSupportedMimeType(file.type)) {
                items.push(file);
              }
            }
          }
          // readEntries returns only 100 entries at a time, so we need to call it multiple times.
          readEntries();
        } else {
          resolve(items);
        }
      });
    }
    readEntries();
  });
}

function readFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise(resolve => {
    entry.file(resolve);
  });
}

async function showOpenFilePicker(images: Image[]) {
  const handles = await (window as any).showOpenFilePicker({
    multiple: true,
    excludeAcceptAllOption: true,
    types: [{
      description: "Images",
      accept: {
        "image/*": [".png", ".jpeg", ".jpg", ".webp", ".avif"],
      }
    }]
  });
  const files: Image[] = [];
  // Would be better to find largest index
  let index = images.length;

  for (const handle of handles) {
    const file = await handle.getFile();
      files.push({
        index,
        file,
        name: file.name,
        date: file.lastModified,
        size: file.size,
        selected: true
      });
      index += 1;
  }
  return removeDuplicates(files, images);
}

async function showDirectoryPicker(images: Image[]) {
  const handle = await (window as any).showDirectoryPicker();
  const files: Image[] = [];
  // Would be better to find largest index
  let index = images.length;

  for await (const value of handle.values()) {
    if (value.kind === "file") {
      const file = await value.getFile();
      files.push({
        index,
        file,
        name: file.name,
        date: file.lastModified,
        size: file.size,
        selected: true
      });
      index += 1;
    }
  }
  return removeDuplicates(files, images);
}

function getSortingValue(sortBy: string, file: Image) {
    if (sortBy === "default") {
      return file.index;
    }
    if (sortBy === "date") {
      return file.date;
    }
    else if (sortBy === "size") {
      return file.size;
    }
    else if (sortBy === "name") {
      // Remove special characters.
      return file.name.toLowerCase().replace(/[^\w\s]/gi, "");
    }
    return 0;
  }

function sortFiles(files: Image[], { sortBy, sortOrder }: { sortBy: string, sortOrder: number }) {
  if (sortBy === "last-accessed") {
    // Invert sort order because we want most recently read files to appear first.
    return sortBySortingValue(files, sortBy, -sortOrder);
  }
  return sortBySortingValue(files, sortBy, sortOrder);
}

function sortBySortingValue(images: Image[], sortBy: string, sortOrder: number) {
  return images.toSorted((a, b) => {
    const aValue = getSortingValue(sortBy, a);
    const bValue = getSortingValue(sortBy, b);

    if (aValue < bValue) {
      return -sortOrder;
    }
    else if (aValue > bValue) {
      return sortOrder;
    }
    return 0;
  });
}

function getThumb(name: string) {
  if (thumbs[name]) {
    return thumbs[name];
  }
}

function resetThumbs() {
  for (const name in thumbs) {
    if (thumbs[name].url) {
      URL.revokeObjectURL(thumbs[name].url);
    }
  }
  thumbs = {};
}

async function convertImageToPng(name: string): Promise<Blob | undefined | null> {
  const url = getPreloadedImage(name);

  if (!url) {
    return undefined;
  }
  const img = new Image();

  return new Promise(resolve => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const { width, height } = getImageDimensions(name);

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
          resolve(blob);
      }, "image/png");
    }
    img.src = url;
  })
}

async function generateThumb(image: Image) {
  if (thumbs[image.name]?.loading) {
    return;
  }
  thumbs[image.name] = { loading: true };

  const blob = await initWorker(image.file);
  thumbs[image.name].blob = blob;
  thumbs[image.name].url = URL.createObjectURL(blob);
  thumbs[image.name].loading = false;
  return thumbs[image.name];
}

function initWorker(file: File): Promise<Blob> {
  return new Promise(resolve => {
    if (!thumbs[file.name].worker) {
      thumbs[file.name].worker = new Worker(new URL("./thumb-worker.js", import.meta.url), { type: "module" })
    }
    thumbs[file.name].worker!.addEventListener("message", handleMessage(resolve));
    thumbs[file.name].worker!.postMessage({ file });
  });
}

function handleMessage(resolve: (blob: Blob) => void) {
  return function handleMessage({ target, data }: MessageEvent) {
    if (target) {
      const worker = target as Worker;
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
    }
    delete thumbs[data.name].worker;
    resolve(data.blob);
  };
}

window.addEventListener("drop", event => {
  event.preventDefault();
});

window.addEventListener("dragover", event => {
  event.preventDefault();
});

export {
  preloadImage,
  cleanupPreloadedImages,
  setImageDimensions,
  getImageDimensions,
  resetImageDimensions,
  convertImageToPng,
  getUniqueImages,
  sortFiles,
  readItems,
  removeDuplicates,
  showOpenFilePicker,
  showDirectoryPicker,
  getThumb,
  resetThumbs,
  generateThumb
};
