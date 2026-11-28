import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { AppText } from "@/shared/ui/AppText";
import { styles } from "@/styles/shared/ui/AppDialog.styles";
import { motion, spacing, useTheme } from "@/theme";

type AppDialogProps = {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
  presentation?: "center" | "bottom";
};

export function AppDialog({
  visible,
  onRequestClose,
  title,
  description,
  children,
  actions,
  presentation = "center",
}: AppDialogProps) {
  const { theme } = useTheme();
  const { colors, shapes } = theme;
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) {
        progress.value = 1;
        return;
      }
      progress.value = 0;
      progress.value = withSpring(1, {
        damping: 25,
        stiffness: 300,
        mass: 0.9,
        overshootClamping: true,
      });
      return;
    }

    if (!visible) {
      if (reduceMotion) {
        progress.value = 0;
        setMounted(false);
        return;
      }

      progress.value = withTiming(
        0,
        {
          duration: motion.settingsOut,
          easing: Easing.bezier(0.4, 0, 1, 1),
        },
        (finished) => {
          if (finished && !visibleRef.current) {
            runOnJS(setMounted)(false);
          }
        }
      );
    }
  }, [progress, reduceMotion, visible]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value),
  }));
  const cardStyle = useAnimatedStyle(() => {
    const value = Math.min(1, progress.value);
    return {
      opacity: value,
      transform: [
        { translateY: (1 - value) * (presentation === "bottom" ? 52 : 16) },
        { scale: presentation === "bottom" ? 0.97 + value * 0.03 : 0.93 + value * 0.07 },
      ],
    };
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.flex}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.scrim },
              scrimStyle,
            ]}
          />
          <Pressable
            accessibilityLabel="Close dialog"
            onPress={onRequestClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="box-none"
            style={[
              styles.backdrop,
              {
                paddingTop: Math.max(insets.top, spacing[6]),
                paddingBottom: Math.max(insets.bottom, spacing[6]),
              },
            ]}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.popup,
                  borderColor: colors.popupBorder,
                  borderRadius: shapes.dialog,
                },
                cardStyle,
              ]}
              accessibilityViewIsModal
            >
              {title || description ? (
                <View style={styles.header}>
                  {title ? <AppText variant="titleLarge">{title}</AppText> : null}
                  {description ? (
                    <AppText
                      variant="bodyMedium"
                      color={colors.popupMuted}
                    >
                      {description}
                    </AppText>
                  ) : null}
                </View>
              ) : null}

              {children ? <View style={styles.body}>{children}</View> : null}

              <View style={styles.actions}>{actions}</View>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
