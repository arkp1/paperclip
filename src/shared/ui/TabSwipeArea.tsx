import { usePathname, useRouter } from "expo-router";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

import { styles } from "@/styles/shared/ui/TabSwipeArea.styles";

const TAB_ROUTES = ["/", "/folders", "/settings"] as const;

const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 550;
const HORIZONTAL_ACTIVATION = 24;
const DRAG_RESISTANCE = 0.16;
const EDGE_RESISTANCE = 0.08;

const SETTLE_SPRING = {
  damping: 30,
  stiffness: 300,
  mass: 1,
};
const EDGE_SPRING = {
  damping: 24,
  stiffness: 240,
  mass: 1,
};

type TabSwipeGuard = ReturnType<typeof Gesture.Native>;
type TabSwipeParent = ReturnType<typeof Gesture.Pan>;

type TabSwipeGuardContextValue = {
  gesture: TabSwipeGuard;
  interactionLock: SharedValue<number>;
  parentGesture: TabSwipeParent;
};

const TabSwipeGuardContext =
  createContext<TabSwipeGuardContextValue | null>(null);

const TabSwipeControlContext = createContext<
  ((active: boolean) => void) | null
>(null);

/**
 * Wraps horizontal scrollers that must take priority over page swipes.
 */
export function useTabSwipeGuardGesture(): TabSwipeGuard {
  const context = useContext(TabSwipeGuardContext);
  const fallbackGesture = useMemo(() => Gesture.Native(), []);
  return context?.gesture ?? fallbackGesture;
}

/**
 * A shared lock for nested horizontal scrollers. It prevents the page-swipe
 * recogniser from acting while a carousel owns the touch sequence.
 */
export function useTabSwipeInteractionLock(): SharedValue<number> {
  const context = useContext(TabSwipeGuardContext);
  const fallbackLock = useSharedValue(0);
  return context?.interactionLock ?? fallbackLock;
}

/** The parent page-swipe gesture, used by native scrollers to block it. */
export function useTabSwipeParentGesture(): TabSwipeParent | null {
  const context = useContext(TabSwipeGuardContext);
  return context?.parentGesture ?? null;
}

/**
 * Registers a nested horizontal scroller as the active touch owner. While it
 * owns the touch, the parent page-swipe Pan is disabled entirely.
 */
export function useTabSwipeCarouselControl(): (active: boolean) => void {
  const setter = useContext(TabSwipeControlContext);
  return setter ?? noop;
}

function noop() {
  // Used only when the hook is called outside the tab layout.
}

/**
 * Horizontal swipes between the three primary tabs: left moves forward
 * (Home → Folders → Settings) and right moves back. The wrapper follows the
 * gesture with resistance and settles on a spring instead of snapping.
 */
export function TabSwipeArea({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentIndex = TAB_ROUTES.indexOf(pathname as (typeof TAB_ROUTES)[number]);
  const translateX = useSharedValue(0);
  const guardGesture = useMemo(() => Gesture.Native(), []);
  const interactionLock = useSharedValue(0);
  const [carouselActive, setCarouselActive] = useState(false);
  const navigateToIndex = useCallback(
    (index: number) => {
      const route = TAB_ROUTES[index];
      if (route) {
        router.navigate(route);
      }
    },
    [router]
  );

  const swipe = Gesture.Pan()
    .enabled(!carouselActive)
    .activeOffsetX([-HORIZONTAL_ACTIVATION, HORIZONTAL_ACTIVATION])
    .failOffsetY([-HORIZONTAL_ACTIVATION, HORIZONTAL_ACTIVATION])
    .onUpdate((event) => {
      if (currentIndex < 0 || interactionLock.value > 0) {
        return;
      }
      const direction = event.translationX < 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;
      const atEdge = nextIndex < 0 || nextIndex >= TAB_ROUTES.length;
      const resistance = atEdge ? EDGE_RESISTANCE : DRAG_RESISTANCE;
      const max = atEdge ? 22 : 38;
      translateX.value = Math.max(
        -max,
        Math.min(max, event.translationX * resistance)
      );
    })
    .onEnd((event) => {
      if (interactionLock.value > 0) {
        translateX.value = withSpring(0, SETTLE_SPRING);
        return;
      }
      if (currentIndex < 0) {
        translateX.value = withSpring(0, SETTLE_SPRING);
        return;
      }

      const isHorizontalSwipe =
        Math.abs(event.translationX) > SWIPE_DISTANCE ||
        Math.abs(event.velocityX) > SWIPE_VELOCITY;

      const direction = event.translationX < 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;

      if (!isHorizontalSwipe || nextIndex < 0 || nextIndex >= TAB_ROUTES.length) {
        translateX.value = withSpring(
          0,
          nextIndex < 0 || nextIndex >= TAB_ROUTES.length
            ? EDGE_SPRING
            : SETTLE_SPRING
        );
        return;
      }

      translateX.value = withSpring(0, SETTLE_SPRING);
      runOnJS(navigateToIndex)(nextIndex);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const contextValue = useMemo<TabSwipeGuardContextValue>(
    () => ({ gesture: guardGesture, interactionLock, parentGesture: swipe }),
    [guardGesture, interactionLock, swipe]
  );

  return (
    <TabSwipeControlContext.Provider value={setCarouselActive}>
      <TabSwipeGuardContext.Provider value={contextValue}>
        <GestureDetector gesture={swipe}>
          <Animated.View style={[styles.container, animatedStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </TabSwipeGuardContext.Provider>
    </TabSwipeControlContext.Provider>
  );
}
