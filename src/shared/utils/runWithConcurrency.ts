/**
 * Runs an async worker over items with a fixed number of concurrent workers.
 * Worker failures propagate after the active runners settle.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  const workerCount = Math.max(1, Math.min(Math.floor(concurrency), items.length));
  let nextIndex = 0;

  const run = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item !== undefined) {
        await worker(item);
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => run()));
}
