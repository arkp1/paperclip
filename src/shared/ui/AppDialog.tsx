import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  View,
} from "react-native";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { AppText } from "@/shared/ui/AppText";
import { styles } from "@/styles/shared/ui/AppDialog.styles";
import { useTheme } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(visible);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (visible) {
      if (!mounted) {
        setMounted(true);
        return;
      }

      if (reduceMotion) {
        scale.setValue(1);
        return;
      }

      scale.setValue(0.96);
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!mounted) {
      return;
    }

    if (reduceMotion) {
      setMounted(false);
      return;
    }

    Animated.timing(scale, {
      toValue: 0.96,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!visibleRef.current) {
        setMounted(false);
      }
    });
  }, [mounted, reduceMotion, scale, visible]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.scrim }]}
          onPress={onRequestClose}
          accessibilityLabel="Close dialog"
        >
          <AnimatedPressable
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: shapes.dialog,
                transform: [{ scale }],
              },
            ]}
            accessibilityViewIsModal
            onPress={() => {
              // Prevent taps inside the dialog from dismissing it.
            }}
          >
            {title || description ? (
              <View style={styles.header}>
                {title ? <AppText variant="titleLarge">{title}</AppText> : null}
                {description ? (
                  <AppText variant="bodyMedium" color={colors.onSurfaceVariant}>
                    {description}
                  </AppText>
                ) : null}
              </View>
            ) : null}

            {children ? <View style={styles.body}>{children}</View> : null}

            <View style={styles.actions}>{actions}</View>
          </AnimatedPressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
