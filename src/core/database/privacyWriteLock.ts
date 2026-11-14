let writeChain: Promise<void> = Promise.resolve();

/**
 * Serializes public/private ownership changes with preview writes. Without
 * this, a preview refresh that started before a move could write a plaintext
 * image after the bookmark has entered the vault.
 */
export function withPrivacyWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
