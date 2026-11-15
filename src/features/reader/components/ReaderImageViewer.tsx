import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/shared/ui/IconButton";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { styles } from "@/styles/features/reader/ReaderImageViewer.styles";

type ReaderImageViewerProps = {
  visible: boolean;
  source: string | null;
  alt: string;
  onClose: () => void;
};

/**
 * Full-screen article image viewer with pinch-to-zoom.
 */
export function ReaderImageViewer({
  visible,
  source,
  alt,
  onClose,
}: ReaderImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(Boolean(source));
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);

  useEffect(() => {
    scale.value = 1;
    startScale.value = 1;
    setLoading(Boolean(source));
    setFailed(false);
    setRetryToken((token) => token + 1);
  }, [source, visible, scale, startScale]);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(5, startScale.value * event.scale));
    })
    .onEnd(() => {
      if (scale.value <= 1.05) {
        scale.value = withTiming(1, { duration: reduceMotion ? 0 : 160 });
      }
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={pinch}>
          <Animated.View
            style={[styles.imageWrap, { width, height }, imageStyle]}
          >
            {source ? (
              <Image
                key={`${source}-${retryToken}`}
                source={{ uri: source }}
                style={[styles.image, failed ? styles.imageHidden : null]}
                contentFit="contain"
                cachePolicy="memory"
                accessibilityLabel={alt}
                onLoadStart={() => {
                  setLoading(true);
                  setFailed(false);
                }}
                onLoad={() => {
                  setLoading(false);
                  setFailed(false);
                }}
                onError={() => {
                  setLoading(false);
                  setFailed(true);
                }}
              />
            ) : null}
            {loading && !failed ? (
              <View style={styles.overlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
            {failed ? (
              <View style={styles.overlay}>
                <AppText variant="bodyMedium" style={styles.errorText}>
                  This image could not be loaded.
                </AppText>
                <Button
                  label="Retry"
                  variant="tonal"
                  onPress={() => {
                    setLoading(true);
                    setFailed(false);
                    setRetryToken((token) => token + 1);
                  }}
                />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
        <View style={[styles.close, { top: insets.top + 8, right: 16 }]}>
          <IconButton
            icon="close"
            label="Close image"
            onPress={() => {
              scale.value = 1;
              onClose();
            }}
            color="#FFFFFF"
            inkColor="#FFFFFF"
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
