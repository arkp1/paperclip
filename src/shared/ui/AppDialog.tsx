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
};

export function AppDialog({
  visible,
  onRequestClose,
  title,
  description,
  children,
  actions,
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
      progress.value = withTiming(1, {
        duration: motion.settingsIn,
        easing: Easing.bezier(0.2, 0, 0, 1),
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
    opacity: progress.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 12 },
      { scale: 0.94 + progress.value * 0.06 },
    ],
  }));

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
                  backgroundColor: colors.surfaceContainerLowest,
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
                      color={colors.onSurfaceVariant}
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
