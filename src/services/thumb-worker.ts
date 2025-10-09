onmessage = async function(event) {
  const { file } = event.data;
  const blob = await resizeImageBlob(file);

  postMessage({ blob, name: file.name });
};

async function resizeImageBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  let { width, height } = bitmap;
  const minSize = Math.min(width, height, 384);

  if (width < height) {
    height = minSize / bitmap.width * height;
    width = minSize;
  }
  else {
    width = minSize / bitmap.height * width;
    height = minSize;
  }
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(bitmap, 0, 0, width, height);

   return canvas.convertToBlob({
    type: blob.type,
    quality: 0.72
  });
}
