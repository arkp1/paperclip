import { Modal, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/shared/ui/IconButton";
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
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(5, startScale.value * event.scale));
    })
    .onEnd(() => {
      if (scale.value <= 1.05) {
        scale.value = withTiming(1, { duration: 160 });
      }
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <GestureDetector gesture={pinch}>
          <Animated.View
            style={[styles.imageWrap, { width, height }, imageStyle]}
          >
            {source ? (
              <Image
                source={{ uri: source }}
                style={styles.image}
                contentFit="contain"
                cachePolicy="memory"
                accessibilityLabel={alt}
              />
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
      </View>
    </Modal>
  );
}
