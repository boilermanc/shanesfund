/**
 * Tesseract.js worker singleton for OCR.
 * Lazy-initialized on first use, reused across retakes, terminated on scanner unmount.
 */
import { createWorker, PSM, type Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;
let progressCallback: ((progress: number) => void) | null = null;

/** Get or create the OCR worker. Pass onProgress to receive 0-100 recognition progress. */
export function getOcrWorker(
  onProgress?: (progress: number) => void
): Promise<Worker> {
  progressCallback = onProgress || null;

  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && progressCallback) {
            progressCallback(Math.round(m.progress * 100));
          }
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :x',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      });
      return worker;
    })().catch((err) => {
      workerPromise = null; // allow retry on next call
      throw err;
    });
  }

  return workerPromise;
}

/** Terminate the worker and free resources */
export async function terminateOcrWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    workerPromise = null;
    progressCallback = null;
    await worker.terminate();
  }
}
