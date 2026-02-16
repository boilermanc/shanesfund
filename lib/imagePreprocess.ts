/**
 * Canvas-based image preprocessing for OCR on lottery tickets.
 * Converts camera frames into high-contrast B&W images that tesseract reads well.
 */

/** Capture a video frame onto a canvas, upscaled for better OCR resolution */
export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // Upscale to ~1200px wide for better OCR accuracy
  const scale = Math.max(1, 1200 / video.videoWidth);
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Convert canvas to grayscale using luminance weighting */
export function toGrayscale(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Boost contrast to make faint thermal printing more readable */
export function boostContrast(canvas: HTMLCanvasElement, factor = 1.5): void {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const intercept = 128 * (1 - factor);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));
    data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept));
    data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept));
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Otsu's method — find the optimal threshold to binarize the image */
export function applyOtsuThreshold(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  const totalPixels = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, wF = 0;
  let maxVariance = 0, threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = totalPixels - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const meanB = sumB / wB;
    const meanF = (sum - sumB) / wF;
    const variance = wB * wF * (meanB - meanF) * (meanB - meanF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Invert if image is mostly dark (tesseract needs dark text on light background) */
export function ensureDarkOnLight(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let darkCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128) darkCount++;
  }

  if (darkCount > (data.length / 4) / 2) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

/** Full preprocessing pipeline: capture → grayscale → contrast → threshold → ensure polarity */
export function preprocessForOcr(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = captureFrame(video);
  toGrayscale(canvas);
  boostContrast(canvas, 1.5);
  applyOtsuThreshold(canvas);
  ensureDarkOnLight(canvas);
  return canvas;
}

/** Capture an image element onto a canvas, upscaled for better OCR resolution */
export function captureFrameFromImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = Math.max(1, 1200 / img.naturalWidth);
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Full preprocessing pipeline for uploaded images */
export function preprocessImageForOcr(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = captureFrameFromImage(img);
  toGrayscale(canvas);
  boostContrast(canvas, 1.5);
  applyOtsuThreshold(canvas);
  ensureDarkOnLight(canvas);
  return canvas;
}
