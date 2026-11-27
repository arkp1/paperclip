import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SaveLinkScreen } from "@/features/save-link/screens/SaveLinkScreen";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useTheme } from "@/theme";

type SaveLinkSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: (folderId: string | null) => void;
};

const SHEET_EASING = Easing.bezier(0.2, 0, 0, 1);
const CLOSE_MS = 220;
const SNAP_MS = 240;

export function SaveLinkSheet({
  visible,
  onClose,
  onSaved,
}: SaveLinkSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const expandedHeight = Math.max(320, height - insets.top);
  const collapsedHeight = Math.min(
    expandedHeight,
    Math.max(420, Math.round(height * 0.74))
  );
  const [mounted, setMounted] = useState(visible);
  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  const sheetHeight = useSharedValue(0);
  const expanded = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const animateTo = (value: number, close = false) => {
    if (reduceMotion) {
      sheetHeight.value = value;
      if (close) {
        setMounted(false);
      }
      return;
    }
    sheetHeight.value = close
      ? withTiming(
          value,
          {
            duration: CLOSE_MS,
            easing: SHEET_EASING,
          },
          (finished) => {
            if (finished && !visibleRef.current) {
              runOnJS(setMounted)(false);
            }
          }
        )
      : withSpring(value, {
          damping: 26,
          stiffness: 280,
          mass: 0.9,
          overshootClamping: true,
        });
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      expanded.value = 0;
      sheetHeight.value = 0;
      animateTo(collapsedHeight);
      return;
    }
    if (mounted) {
      animateTo(0, true);
    }
    // Sheet height is intentionally driven by visible changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible || !mounted) {
      return;
    }
    // The overlay must never outlive the close animation and keep
    // intercepting touches if a spring callback is interrupted.
    const timer = setTimeout(() => setMounted(false), 450);
    return () => clearTimeout(timer);
  }, [mounted, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, sheetHeight.value / expandedHeight) * 0.52,
  }));

  const drag = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      dragStart.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      sheetHeight.value = Math.max(
        0,
        Math.min(expandedHeight, dragStart.value - event.translationY)
      );
    })
    .onEnd((event) => {
      const midpoint = (collapsedHeight + expandedHeight) / 2;
      const collapseFromExpanded =
        expanded.value === 1 &&
        (event.velocityY > 300 ||
          sheetHeight.value < expandedHeight - 80);
      const shouldExpand =
        expanded.value === 0 &&
        (event.velocityY < -500 || sheetHeight.value > midpoint);
      const shouldDismiss =
        expanded.value === 0 &&
        (event.velocityY > 900 || sheetHeight.value < collapsedHeight - 80);

      if (reduceMotion) {
        if (shouldDismiss) {
          runOnJS(onClose)();
          return;
        }
        if (expanded.value === 1) {
          if (collapseFromExpanded) {
            expanded.value = 0;
          }
          sheetHeight.value = expanded.value ? expandedHeight : collapsedHeight;
          return;
        }
        expanded.value = shouldExpand ? 1 : 0;
        sheetHeight.value = expanded.value ? expandedHeight : collapsedHeight;
        return;
      }

      if (collapseFromExpanded) {
        expanded.value = 0;
        sheetHeight.value = withTiming(collapsedHeight, {
          duration: SNAP_MS,
          easing: SHEET_EASING,
        });
        return;
      }

      if (expanded.value === 1) {
        sheetHeight.value = withTiming(expandedHeight, {
          duration: SNAP_MS,
          easing: SHEET_EASING,
        });
        return;
      }

      if (shouldExpand) {
        expanded.value = 1;
        sheetHeight.value = withTiming(expandedHeight, {
          duration: SNAP_MS,
          easing: SHEET_EASING,
        });
        return;
      }
      if (shouldDismiss) {
        runOnJS(onClose)();
        return;
      }
      expanded.value = 0;
      sheetHeight.value = withTiming(collapsedHeight, {
        duration: SNAP_MS,
        easing: SHEET_EASING,
      });
    });

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (expanded.value === 1) {
          expanded.value = 0;
          sheetHeight.value = reduceMotion
            ? collapsedHeight
            : withTiming(collapsedHeight, {
                duration: SNAP_MS,
                easing: SHEET_EASING,
              });
        } else {
          onClose();
        }
        return true;
      }
    );
    return () => subscription.remove();
  }, [collapsedHeight, expanded, mounted, onClose, reduceMotion, sheetHeight]);

  if (!mounted) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.scrim },
          backdropStyle,
        ]}
      />
      <Pressable
        accessibilityLabel="Dismiss save sheet"
        onPress={() => {
          if (expanded.value === 1) {
            expanded.value = 0;
            sheetHeight.value = reduceMotion
              ? collapsedHeight
              : withTiming(collapsedHeight, {
                  duration: SNAP_MS,
                  easing: SHEET_EASING,
                });
          } else {
            onClose();
          }
        }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            height: expandedHeight,
            backgroundColor: theme.colors.surface,
          },
          sheetStyle,
        ]}
      >
          <View style={styles.header}>
            <GestureDetector gesture={drag}>
              <View collapsable={false} style={styles.dragArea}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />
              </View>
            </GestureDetector>
          </View>
          <View style={styles.content}>
            <SaveLinkScreen
              embedded
              onSaved={onSaved}
              onRequestClose={onClose}
            />
          </View>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 100,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    elevation: 20,
  },
  header: {
    height: 44,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  dragArea: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
