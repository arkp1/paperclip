import { useCallback, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import type { BookmarkViewMode } from "@/features/bookmarks/types";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/features/bookmarks/BookmarkViewSelector.styles";
import { useTheme } from "@/theme";

const OPTION_SIZE = 40;
const OPTION_GAP = 4;
const OPTION_STEP = OPTION_SIZE + OPTION_GAP;
const MAX_INDEX = 2;

const VIEW_OPTIONS: { icon: IconName; label: string; mode: BookmarkViewMode }[] = [
  { mode: "grid", icon: "view-grid-outline", label: "Grid layout" },
  { mode: "list", icon: "format-list-bulleted", label: "List layout" },
  { mode: "cards", icon: "view-agenda-outline", label: "Cards layout" },
];

type BookmarkViewSelectorProps = {
  viewMode: BookmarkViewMode;
  onChange: (mode: BookmarkViewMode) => void;
};

export function BookmarkViewSelector({ viewMode, onChange }: BookmarkViewSelectorProps) {
  const { theme } = useTheme();
  const selectedIndex = Math.max(
    0,
    VIEW_OPTIONS.findIndex((option) => option.mode === viewMode)
  );
  const indicatorX = useRef(new Animated.Value(selectedIndex * OPTION_STEP)).current;
  const reduceMotion = useReducedMotion();
  const dragStartX = useRef(selectedIndex * OPTION_STEP);
  const draggedX = useRef(selectedIndex * OPTION_STEP);

  const animateIndicator = useCallback(
    (index: number) => {
      const target = index * OPTION_STEP;

      if (reduceMotion) {
        indicatorX.setValue(target);
        return;
      }

      Animated.spring(indicatorX, {
        toValue: target,
        useNativeDriver: true,
        speed: 26,
        bounciness: 4,
      }).start();
    },
    [indicatorX, reduceMotion]
  );

  useEffect(() => {
    animateIndicator(selectedIndex);
  }, [animateIndicator, selectedIndex]);

  const dragSelection = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .failOffsetY([-16, 16])
    .onBegin(() => {
      indicatorX.stopAnimation((value) => {
        dragStartX.current = value;
        draggedX.current = value;
      });
    })
    .onUpdate((event) => {
      const next = Math.max(
        0,
        Math.min(MAX_INDEX * OPTION_STEP, dragStartX.current + event.translationX)
      );
      draggedX.current = next;
      indicatorX.setValue(next);
    })
    .onEnd(() => {
      const nextIndex = Math.max(
        0,
        Math.min(MAX_INDEX, Math.round(draggedX.current / OPTION_STEP))
      );

      if (nextIndex !== selectedIndex) {
        onChange(VIEW_OPTIONS[nextIndex].mode);
      } else {
        animateIndicator(selectedIndex);
      }
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={dragSelection}>
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                backgroundColor: theme.colors.primaryContainer,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />

          {VIEW_OPTIONS.map((option) => {
            const isSelected = viewMode === option.mode;

            return (
              <ScalePressable
                key={option.mode}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: isSelected }}
                hitSlop={4}
                onPress={() => onChange(option.mode)}
                scaleTo={0.92}
                style={styles.option}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={20}
                  color={
                    isSelected
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                />
              </ScalePressable>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}
