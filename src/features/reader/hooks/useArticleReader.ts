import { useCallback, useState } from "react";
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

export function useArticleReader(bookmarkId: string) {
  const [state, setState] = useState<ReaderState>({
    bookmark: null,
    blocks: [],
    wordCount: 0,
    status: "loading",
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const bookmark = await getReadableBookmarkById(bookmarkId);
      if (!bookmark) {
        setState((previous) => ({
          ...previous,
          status: "not_found",
          bookmark: null,
        }));
        return;
      }

      const article = await loadArticle(bookmarkId);
      setState({
        bookmark,
        blocks: article.blocks,
        wordCount: article.wordCount,
        status: "ready",
        errorMessage: null,
      });
    } catch (error) {
      console.warn("Could not load the article.", error);
      setState((previous) => ({
        ...previous,
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
