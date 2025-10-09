let thumbs: {
  [name: string]: {
    url?: string;
    blob?: Blob;
    loading: boolean;
    worker?: Worker;
  }
} = {};

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

  return removeDuplicates(files, uploadedItems);
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

async function showOpenFilePicker() {
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

  for (const handle of handles) {
    const file = await handle.getFile();
    files.push({ file, name: file.name, selected: true });
  }
  return files;
}

async function showDirectoryPicker() {
  const handle = await (window as any).showDirectoryPicker();
  const files: Image[] = [];

  for await (const value of handle.values()) {
    if (value.kind === "file") {
      const file = await value.getFile();
      files.push({ file, name: file.name, selected: true });
    }
  }
  return files;
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
    // setTimeout(() => {
    //   if (target) {
    //     const worker = target as Worker;
    //     worker.removeEventListener("message", handleMessage);
    //     worker.terminate();
    //   }
    //   delete thumbs[data.name].worker;
    // }, 10000);
    resolve(data.blob);
  };
}

// function resizeImageBlob(blob: Blob): Promise<Blob> {
//   return new Promise(resolve => {
//     const img = new Image();

//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d")!;
//       const width = 384;

//       if (img.width < width) {
//         resolve(blob);
//         URL.revokeObjectURL(img.src);
//         return;
//       }
//       const height = img.height * (width / img.width);

//       canvas.width = width;
//       canvas.height = height;

//       ctx.drawImage(img, 0, 0, width, height);

//       canvas.toBlob(resolve as BlobCallback, "image/jpeg", 0.8);
//       URL.revokeObjectURL(img.src);
//     };
//     img.src = URL.createObjectURL(blob);
//   });
// }

window.addEventListener("drop", event => {
  event.preventDefault();
});

window.addEventListener("dragover", event => {
  event.preventDefault();
});

export {
  readItems,
  removeDuplicates,
  showOpenFilePicker,
  showDirectoryPicker,
  getThumb,
  resetThumbs,
  generateThumb
};
