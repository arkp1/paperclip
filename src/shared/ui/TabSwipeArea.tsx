import { usePathname, useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View } from "react-native";
import type { ReactNode } from "react";

import { styles } from "@/styles/shared/ui/TabSwipeArea.styles";

const TAB_ROUTES = ["/", "/folders", "/settings"] as const;

const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 550;
const HORIZONTAL_ACTIVATION = 24;

/**
 * Horizontal swipes between the three primary tabs: left moves forward
 * (Home → Folders → Settings) and right moves back. The offsets let vertical
 * scrolling win before the pan activates.
 */
export function TabSwipeArea({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentIndex = TAB_ROUTES.indexOf(pathname as (typeof TAB_ROUTES)[number]);

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-HORIZONTAL_ACTIVATION, HORIZONTAL_ACTIVATION])
    .failOffsetY([-HORIZONTAL_ACTIVATION, HORIZONTAL_ACTIVATION])
    .onEnd((event) => {
      if (currentIndex < 0) {
        return;
      }

      const isHorizontalSwipe =
        Math.abs(event.translationX) > SWIPE_DISTANCE ||
        Math.abs(event.velocityX) > SWIPE_VELOCITY;

      if (!isHorizontalSwipe) {
        return;
      }

      const direction = event.translationX < 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length) {
        return;
      }

      router.navigate(TAB_ROUTES[nextIndex]);
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
}
