type BookmarkChangeListener = (bookmarkIds: ReadonlySet<string>) => void;

const listeners = new Set<BookmarkChangeListener>();
const pendingIds = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  flushTimer = null;
  if (pendingIds.size === 0) {
    return;
  }
  const changedIds = new Set(pendingIds);
  pendingIds.clear();
  for (const listener of listeners) {
    listener(changedIds);
  }
}

/**
 * Coalesces bookmark asset/metadata notifications into one batch. A preview
 * refresh can update many bookmarks in quick succession; listeners should not
 * rerun their list query once per item.
 */
export function emitBookmarkChanged(bookmarkId: string): void {
  pendingIds.add(bookmarkId);
  if (flushTimer) {
    return;
  }
  flushTimer = setTimeout(flush, 16);
}

export function subscribeBookmarkChanges(
  listener: BookmarkChangeListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
