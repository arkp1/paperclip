import { StyleSheet, View } from "react-native";
import { usePathname } from "expo-router";

import { ReaderPlayer } from "@/features/reader/components/ReaderPlayer";
import { useReaderAudio } from "@/features/reader/audio/ReaderAudioProvider";

/**
 * Root-level listening player. It remains mounted while navigation changes so
 * audio and the mini player continue outside the reader.
 */
export function ReaderAudioHost() {
  const { track, clear } = useReaderAudio();
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const inReader = normalizedPath === "/read" || normalizedPath.startsWith("/read/");
  const isMainTab =
    normalizedPath === "/" ||
    normalizedPath === "/folders" ||
    normalizedPath === "/settings";
  const bottomOffset = inReader ? 12 : isMainTab ? 96 : 12;

  if (!track) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <ReaderPlayer
        key={track.id}
        title={track.title}
        paragraphs={track.paragraphs}
        bottomOffset={bottomOffset}
        onClose={clear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    elevation: 999,
  },
});
