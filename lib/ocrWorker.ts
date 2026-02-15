/**
 * Tesseract.js worker singleton for OCR.
 * Lazy-initialized on first use, reused across retakes, terminated on scanner unmount.
 */
import { createWorker, PSM, type Worker } from 'tesseract.js';

let workerInstance: Worker | null = null;
let progressCallback: ((progress: number) => void) | null = null;

/** Get or create the OCR worker. Pass onProgress to receive 0-100 recognition progress. */
export async function getOcrWorker(
  onProgress?: (progress: number) => void
): Promise<Worker> {
  progressCallback = onProgress || null;

  if (!workerInstance) {
    workerInstance = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && progressCallback) {
          progressCallback(Math.round(m.progress * 100));
        }
      },
    });
    await workerInstance.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :x',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    });
  }

  return workerInstance;
}

/** Terminate the worker and free resources */
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    progressCallback = null;
  }
}
