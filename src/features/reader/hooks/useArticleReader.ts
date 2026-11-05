import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import type { Bookmark } from "@/features/bookmarks/types";
import { getReadableBookmarkById } from "@/features/bookmarks/data/bookmarkRepository";
import {
  loadArticle,
  type ArticleBlock,
} from "@/features/reader/services/articleService";

type ReaderState = {
  bookmark: Bookmark | null;
  blocks: ArticleBlock[];
  wordCount: number;
  status: "loading" | "ready" | "not_found" | "error";
  errorMessage: string | null;
};

/**
 * Loads the readable bookmark and cached article text. A generation guard
 * prevents stale requests from overwriting newer reader state.
 */
export function useArticleReader(bookmarkId: string) {
  const [state, setState] = useState<ReaderState>({
    bookmark: null,
    blocks: [],
    wordCount: 0,
    status: "loading",
    errorMessage: null,
  });
  const generation = useRef(0);

  const load = useCallback(async () => {
    const run = generation.current + 1;
    generation.current = run;
    setState({
      bookmark: null,
      blocks: [],
      wordCount: 0,
      status: "loading",
      errorMessage: null,
    });

    let loadedBookmark: Bookmark | null = null;

    try {
      loadedBookmark = await getReadableBookmarkById(bookmarkId);
      if (run !== generation.current) {
        return;
      }

      if (!loadedBookmark) {
        setState({
          bookmark: null,
          blocks: [],
          wordCount: 0,
          status: "not_found",
          errorMessage: null,
        });
        return;
      }

      const article = await loadArticle(bookmarkId);
      if (run !== generation.current) {
        return;
      }

      setState({
        bookmark: loadedBookmark,
        blocks: article.blocks,
        wordCount: article.wordCount,
        status: "ready",
        errorMessage: null,
      });
    } catch (error) {
      if (run !== generation.current) {
        return;
      }
      console.warn("Could not load the article.", error);
      setState((previous) => ({
        ...previous,
        bookmark: loadedBookmark ?? previous.bookmark,
        status: "error",
        errorMessage:
          "This article could not be prepared. Open the original or try refreshing the link.",
      }));
    }
  }, [bookmarkId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { ...state, reload: load };
}
