import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";

import { IconButton } from "@/shared/ui/IconButton";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/reader/ReaderPlayer.styles";
import { useTheme } from "@/theme";

type ReaderPlayerProps = {
  title: string;
  paragraphs: string[];
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

/**
 * Mini listening player with a spring-expanded sheet, progress, and speed
 * controls. Speech is chunked to respect the platform input limit.
 */
export function ReaderPlayer({ title, paragraphs }: ReaderPlayerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const rateRef = useRef(1);
  const currentChunk = useRef(0);
  const cancelled = useRef(false);
  const playbackGeneration = useRef(0);
  const expansion = useRef(new Animated.Value(0)).current;

  const { chunks, offsets, totalChars } = useMemo(
    () => buildSpeechChunks(paragraphs),
    [paragraphs]
  );

  const stop = () => {
    playbackGeneration.current += 1;
    cancelled.current = true;
    setSpeaking(false);
    void Speech.stop();
  };

  const speakFrom = (index: number, speed: number, generation: number) => {
    if (
      cancelled.current ||
      generation !== playbackGeneration.current ||
      index >= chunks.length
    ) {
      if (
        !cancelled.current &&
        generation === playbackGeneration.current &&
        index >= chunks.length
      ) {
        setProgress(1);
        setSpeaking(false);
      }
      return;
    }

    currentChunk.current = index;
    const base = offsets[index] ?? 0;
    setProgress(Math.min(1, base / totalChars));
    Speech.speak(chunks[index], {
      rate: speed,
      onBoundary: (event: { charIndex: number; charLength: number }) => {
        if (generation !== playbackGeneration.current) {
          return;
        }
        setProgress(
          Math.min(1, (base + (event.charIndex ?? 0)) / totalChars)
        );
      },
      onDone: () => {
        if (generation === playbackGeneration.current) {
          speakFrom(index + 1, rateRef.current, generation);
        }
      },
      onStopped: () => {
        if (generation === playbackGeneration.current) {
          setSpeaking(false);
        }
      },
      onError: () => {
        if (generation === playbackGeneration.current) {
          setSpeaking(false);
        }
      },
    });
  };

  const startPlayback = (index: number, speed: number) => {
    playbackGeneration.current += 1;
    const generation = playbackGeneration.current;
    cancelled.current = false;
    setSpeaking(true);
    speakFrom(index, speed, generation);
  };

  const togglePlayback = () => {
    if (speaking) {
      stop();
      return;
    }

    if (progress >= 0.999) {
      setProgress(0);
      currentChunk.current = 0;
    }

    startPlayback(currentChunk.current, rateRef.current);
  };

  const changeRate = (next: number) => {
    rateRef.current = next;
    setRate(next);

    if (!speaking) {
      return;
    }

    playbackGeneration.current += 1;
    const generation = playbackGeneration.current;
    cancelled.current = true;
    void Speech.stop().then(() => {
      if (generation !== playbackGeneration.current) {
        return;
      }
      cancelled.current = false;
      setSpeaking(true);
      speakFrom(currentChunk.current, next, generation);
    });
  };

  useEffect(() => {
    return () => {
      playbackGeneration.current += 1;
      cancelled.current = true;
      void Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    expansion.setValue(0);
    Animated.spring(expansion, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 2,
    }).start();
  }, [expanded, expansion]);

  return (
    <>
      <View
        style={[
          styles.mini,
          {
            bottom: insets.bottom + 12,
            backgroundColor: theme.colors.surfaceContainerHigh,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: theme.colors.primary },
            ]}
          />
        </View>

        <Pressable
          style={styles.miniInfo}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Open listening player"
        >
          <View style={styles.miniCopy}>
            <Text
              numberOfLines={1}
              style={[styles.miniTitle, { color: theme.colors.onSurface }]}
            >
              {title}
            </Text>
            <Text style={[styles.miniMeta, { color: theme.colors.onSurfaceVariant }]}>
              {speaking ? "Listening" : "Listen"} · {rate}×
            </Text>
          </View>
        </Pressable>

        <IconButton
          icon={speaking ? "pause" : "play"}
          label={speaking ? "Pause reading" : "Play reading"}
          onPress={togglePlayback}
          color={theme.colors.primary}
        />
      </View>

      {expanded ? (
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable
            style={[styles.backdrop, { backgroundColor: theme.colors.scrim }]}
            onPress={() => setExpanded(false)}
            accessibilityLabel="Close player"
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: insets.bottom + 24,
                backgroundColor: theme.colors.surfaceContainerLowest,
                borderColor: theme.colors.outlineVariant,
                transform: [
                  {
                    translateY: expansion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [56, 0],
                    }),
                  },
                  {
                    scale: expansion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
                  READING ALOUD
                </Text>
                <Text
                  numberOfLines={3}
                  style={[styles.sheetTitle, { color: theme.colors.onSurface }]}
                >
                  {title}
                </Text>
              </View>
              <IconButton
                icon="chevron-down"
                label="Collapse player"
                onPress={() => setExpanded(false)}
              />
            </View>

            <View style={styles.bigProgressTrack}>
              <View
                style={[
                  styles.bigProgressFill,
                  { width: `${progress * 100}%`, backgroundColor: theme.colors.primary },
                ]}
              />
            </View>

            <View style={styles.controls}>
              <ScalePressable
                accessibilityRole="button"
                accessibilityLabel={speaking ? "Pause" : "Play"}
                onPress={togglePlayback}
                scaleTo={0.9}
                style={[
                  styles.playButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name={speaking ? "pause" : "play"}
                  size={34}
                  color={theme.colors.onPrimary}
                />
              </ScalePressable>
            </View>

            <View style={styles.speeds}>
              {SPEEDS.map((speed) => {
                const selected = rate === speed;
                return (
                  <ScalePressable
                    key={speed}
                    accessibilityRole="radio"
                    accessibilityLabel={`${speed} times speed`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => changeRate(speed)}
                    scaleTo={0.94}
                    style={[
                      styles.speedChip,
                      {
                        backgroundColor: selected
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedText,
                        {
                          color: selected
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {speed}×
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

function buildSpeechChunks(paragraphs: string[]): {
  chunks: string[];
  offsets: number[];
  totalChars: number;
} {
  const maxLength = Math.max(
    400,
    Math.min(1800, Speech.maxSpeechInputLength || 1800)
  );
  const chunks: string[] = [];
  const offsets: number[] = [];
  let current = "";
  let offset = 0;

  const flush = () => {
    if (!current) {
      return;
    }
    chunks.push(current);
    offsets.push(offset);
    offset += current.length;
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxLength) {
      flush();
      let rest = paragraph;
      while (rest.length > maxLength) {
        let cut = rest.lastIndexOf(" ", maxLength);
        if (cut < Math.floor(maxLength * 0.5)) {
          cut = maxLength;
        }
        const part = rest.slice(0, cut).trim();
        if (part) {
          chunks.push(part);
          offsets.push(offset);
          offset += part.length;
        }
        rest = rest.slice(cut).trim();
      }
      current = rest;
      continue;
    }

    if (current.length + paragraph.length + 2 > maxLength) {
      flush();
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }

  flush();

  return { chunks, offsets, totalChars: Math.max(1, offset) };
}
