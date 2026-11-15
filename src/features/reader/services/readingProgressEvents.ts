type ReadingProgressListener = (bookmarkId: string, progress: number) => void;

const listeners = new Set<ReadingProgressListener>();

/**
 * Notifies mounted bookmark lists after reading progress has been persisted.
 * This keeps cards in sync without refetching the whole library.
 */
export function emitReadingProgress(
  bookmarkId: string,
  progress: number
): void {
  const normalized = Math.max(0, Math.min(1, progress));
  for (const listener of listeners) {
    listener(bookmarkId, normalized);
  }
}

export function subscribeReadingProgress(
  listener: ReadingProgressListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
