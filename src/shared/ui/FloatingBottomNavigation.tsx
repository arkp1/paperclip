import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "expo-router/tabs";

import { AppText } from "@/shared/ui/AppText";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import {
  CAPSULE_HEIGHT,
  styles,
} from "@/styles/shared/ui/FloatingBottomNavigation.styles";
import { spacing, useTheme } from "@/theme";

const CAPSULE_BOTTOM_GAP = spacing[5];
const MIN_BOTTOM_INSET = spacing[4];
const CONTENT_GAP_ABOVE_BAR = spacing[4];

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "home-variant", inactive: "home-variant-outline" },
  folders: { active: "folder", inactive: "folder-outline" },
  settings: { active: "cog", inactive: "cog-outline" },
};

type TabLayout = { x: number; width: number };

function getBarBottomOffset(bottomInset: number): number {
  return Math.max(bottomInset, MIN_BOTTOM_INSET) + CAPSULE_BOTTOM_GAP;
}

/**
 * Scrollable screens reserve this much space so the floating capsule never
 * covers the last row or an action.
 */
export function useFloatingNavigationInset(): number {
  const insets = useSafeAreaInsets();
  return (
    getBarBottomOffset(insets.bottom) + CAPSULE_HEIGHT + CONTENT_GAP_ABOVE_BAR
  );
}

export function FloatingBottomNavigation({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const [layouts, setLayouts] = useState<TabLayout[]>([]);
  const pillX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;
  const hasPositioned = useRef(false);
  const reduceMotion = useReducedMotion();

  const selectedLayout = layouts[state.index];
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const draggedX = useRef(0);

  const animatePillTo = useCallback(
    (layout: TabLayout | null) => {
      if (!layout) {
        return;
      }

      if (reduceMotion) {
        pillX.setValue(layout.x);
        pillWidth.setValue(layout.width);
        return;
      }

      Animated.parallel([
        Animated.timing(pillX, {
          toValue: layout.x,
          duration: 140,
          useNativeDriver: false,
        }),
        Animated.timing(pillWidth, {
          toValue: layout.width,
          duration: 140,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [pillWidth, pillX, reduceMotion]
  );

  useEffect(() => {
    if (!selectedLayout) {
      return;
    }

    if (!hasPositioned.current) {
      pillX.setValue(selectedLayout.x);
      pillWidth.setValue(selectedLayout.width);
      hasPositioned.current = true;
      return;
    }

    animatePillTo(selectedLayout);
  }, [animatePillTo, pillWidth, pillX, selectedLayout]);

  const dragSelection = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .failOffsetY([-18, 18])
    .onBegin(() => {
      pillX.stopAnimation((value) => {
        dragStartX.current = value;
        draggedX.current = value;
      });
      pillWidth.stopAnimation((value) => {
        dragStartWidth.current = value;
      });
    })
    .onUpdate((event) => {
      if (layouts.length === 0) {
        return;
      }

      const first = layouts[0];
      const last = layouts[layouts.length - 1];
      const min = first?.x ?? 0;
      const max = last ? last.x + last.width - dragStartWidth.current : min;
      const next = Math.max(min, Math.min(max, dragStartX.current + event.translationX));

      draggedX.current = next;
      pillX.setValue(next);
    })
    .onEnd(() => {
      if (layouts.length === 0) {
        return;
      }

      const center = draggedX.current + dragStartWidth.current / 2;
      let closestIndex = state.index;
      let closestDistance = Number.MAX_SAFE_INTEGER;

      layouts.forEach((layout, index) => {
        if (!layout) {
          return;
        }
        const layoutCenter = layout.x + layout.width / 2;
        const distance = Math.abs(layoutCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      const targetRoute = state.routes[closestIndex];
      if (!targetRoute) {
        return;
      }

      if (closestIndex !== state.index) {
        navigateToTab(targetRoute.key);
      } else {
        animatePillTo(selectedLayout);
      }
    });

  const handleItemLayout = useCallback((index: number, layout: TabLayout) => {
    setLayouts((previous) => {
      const current = previous[index];
      if (current && current.x === layout.x && current.width === layout.width) {
        return previous;
      }
      const next = [...previous];
      next[index] = layout;
      return next;
    });
  }, []);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: getBarBottomOffset(insets.bottom) }]}
    >
      <GestureDetector gesture={dragSelection}>
        <View
          style={[
            styles.capsule,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selectionPill,
            {
              backgroundColor: colors.primaryContainer,
              left: pillX,
              width: pillWidth,
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label =
            typeof options?.title === "string" ? options.title : route.name;

          const icon = icons[route.name] ?? icons.folders;

          return (
            <TabItem
              key={route.key}
              index={index}
              label={label}
              icon={icon}
              isFocused={isFocused}
              onLayout={handleItemLayout}
              onPress={() => {
                const event = emitter.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              }}
            />
          );
        })}
        </View>
      </GestureDetector>
    </View>
  );
}

type TabItemProps = {
  index: number;
  label: string;
  icon: { active: IconName; inactive: IconName };
  isFocused: boolean;
  onPress: () => void;
  onLayout: (index: number, layout: TabLayout) => void;
};

function TabItem({
  index,
  label,
  icon,
  isFocused,
  onPress,
  onLayout,
}: TabItemProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const selection = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      selection.setValue(isFocused ? 1 : 0);
      return;
    }

    Animated.timing(selection, {
      toValue: isFocused ? 1 : 0,
      duration: 130,
      useNativeDriver: true,
    }).start();
  }, [isFocused, reduceMotion, selection]);

  const iconScale = selection.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <ScalePressable
      accessibilityRole="tab"
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      scaleTo={0.96}
      onLayout={(event) => onLayout(index, event.nativeEvent.layout)}
      style={styles.item}
    >
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <MaterialCommunityIcons
          name={isFocused ? icon.active : icon.inactive}
          size={22}
          color={isFocused ? colors.onPrimaryContainer : colors.onSurfaceVariant}
        />
      </Animated.View>

      <AppText
        variant="labelMedium"
        color={isFocused ? colors.onPrimaryContainer : colors.onSurfaceVariant}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </ScalePressable>
  );
}
