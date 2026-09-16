// Compresses a photo client-side before it ever reaches Supabase Storage —
// keeps receipts legible while using a fraction of the original file size.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;

  const img = await loadImage(file);
  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo comprimir la imagen'));
          return;
        }
        // Only use the compressed version if it's actually smaller
        resolve(blob.size < file.size ? blob : file);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}
