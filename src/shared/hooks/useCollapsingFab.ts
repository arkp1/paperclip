import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/**
 * Collapses an extended FAB while scrolling down and expands it again on an
 * upward scroll or at the top of the list.
 */
export function useCollapsingFab() {
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollY = useRef(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const delta = y - lastScrollY.current;

      if (y <= 8) {
        setCollapsed(false);
      } else if (delta > 6) {
        setCollapsed(true);
      } else if (delta < -6) {
        setCollapsed(false);
      }

      lastScrollY.current = y;
    },
    []
  );

  return { collapsed, onScroll };
}
