import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";

import { IconButton } from "@/shared/ui/IconButton";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/reader/ReaderPlayer.styles";
import { useTheme } from "@/theme";

type ReaderPlayerProps = {
  title: string;
  paragraphs: string[];
  bottomOffset?: number;
  onClose?: () => void;
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

/**
 * Mini listening player with a spring-expanded sheet, progress, and speed
 * controls. Speech is chunked to respect the platform input limit.
 */
export function ReaderPlayer({ title, paragraphs, bottomOffset = 12, onClose }: ReaderPlayerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [speechError, setSpeechError] = useState(false);
  const [closing, setClosing] = useState(false);
  const miniVisibility = useRef(new Animated.Value(0)).current;
  const miniLift = useRef(
    new Animated.Value(Math.max(0, bottomOffset - 12))
  ).current;
  const rateRef = useRef(1);
  const currentChunk = useRef(0);
  const resumeChar = useRef(0);
  const cancelled = useRef(false);
  const playbackGeneration = useRef(0);
  const expansion = useRef(new Animated.Value(0)).current;
  const renderedRef = useRef(false);

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

  const speakFrom = (
    index: number,
    speed: number,
    generation: number,
    startChar = 0
  ) => {
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
    resumeChar.current = startChar;
    const text = chunks[index].slice(startChar);
    const base = (offsets[index] ?? 0) + startChar;
    setProgress(Math.min(1, base / totalChars));
    try {
      Speech.speak(text, {
        rate: speed,
        onBoundary: (event: { charIndex: number; charLength: number }) => {
          if (generation !== playbackGeneration.current) {
            return;
          }
          resumeChar.current = startChar + (event.charIndex ?? 0);
          setProgress(
            Math.min(1, (base + (event.charIndex ?? 0)) / totalChars)
          );
        },
        onDone: () => {
          if (generation === playbackGeneration.current) {
            resumeChar.current = 0;
            speakFrom(index + 1, rateRef.current, generation, 0);
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
            setSpeechError(true);
          }
        },
      });
    } catch {
      setSpeaking(false);
      setSpeechError(true);
    }
  };

  const startPlayback = (
    index: number,
    speed: number,
    startChar = 0
  ) => {
    setSpeechError(false);
    playbackGeneration.current += 1;
    const generation = playbackGeneration.current;
    cancelled.current = false;
    setSpeaking(true);
    speakFrom(index, speed, generation, startChar);
  };

  const jumpTo = (index: number, startChar = 0) => {
    const next = Math.max(0, Math.min(chunks.length - 1, index));
    currentChunk.current = next;
    resumeChar.current = startChar;
    setProgress(
      Math.min(1, ((offsets[next] ?? 0) + startChar) / totalChars)
    );

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
      speakFrom(next, rateRef.current, generation, startChar);
    });
  };

  const togglePlayback = () => {
    if (speaking) {
      stop();
      return;
    }

    if (progress >= 0.999) {
      setProgress(0);
      currentChunk.current = 0;
      resumeChar.current = 0;
    }

    startPlayback(
      currentChunk.current,
      rateRef.current,
      resumeChar.current
    );
  };

  const changeRate = (next: number) => {
    rateRef.current = next;
    setRate(next);

    if (speaking) {
      jumpTo(currentChunk.current, resumeChar.current);
    }
  };

  const seekBy = (direction: -1 | 1) => {
    jumpTo(currentChunk.current + direction, 0);
  };

  const seekToFraction = (fraction: number) => {
    const targetChar = Math.max(
      0,
      Math.min(totalChars - 1, Math.round(fraction * totalChars))
    );
    let index = 0;
    while (
      index + 1 < offsets.length &&
      offsets[index + 1] <= targetChar
    ) {
      index += 1;
    }
    jumpTo(index, Math.max(0, targetChar - (offsets[index] ?? 0)));
  };

  useEffect(() => {
    return () => {
      playbackGeneration.current += 1;
      cancelled.current = true;
      void Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      miniVisibility.setValue(1);
      miniLift.setValue(Math.max(0, bottomOffset - 12));
      return;
    }
    Animated.spring(miniVisibility, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 2,
    }).start();
  }, [miniVisibility, reduceMotion]);

  useEffect(() => {
    const target = Math.max(0, bottomOffset - 12);
    if (reduceMotion) {
      miniLift.setValue(target);
      return;
    }
    Animated.timing(miniLift, {
      toValue: target,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [bottomOffset, miniLift, reduceMotion]);

  const closeMini = () => {
    if (closing) {
      return;
    }
    setClosing(true);
    stop();
    if (reduceMotion || !onClose) {
      onClose?.();
      return;
    }
    Animated.timing(miniVisibility, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose?.();
      }
    });
  };

  useEffect(() => {
    renderedRef.current = rendered;
  }, [rendered]);

  useEffect(() => {
    if (expanded) {
      setRendered(true);
      expansion.setValue(0);
      Animated.spring(expansion, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 2,
      }).start();
      return;
    }

    if (!renderedRef.current) {
      return;
    }

    Animated.timing(expansion, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
      }
    });
  }, [expanded, expansion]);

  return (
    <>
      <Animated.View
        pointerEvents={closing ? "none" : "auto"}
        style={[
          styles.mini,
          {
            bottom: insets.bottom + 12,
            backgroundColor: theme.colors.surfaceContainerHigh,
            borderColor: theme.colors.outlineVariant,
            opacity: miniVisibility,
            transform: [
              {
                translateY: Animated.subtract(
                  miniVisibility.interpolate({
                    inputRange: [0, 1],
                    outputRange: [36, 0],
                  }),
                  miniLift
                ),
              },
              {
                scale: miniVisibility.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
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

        <ScalePressable
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
              {speechError
                ? "Speech unavailable"
                : `${speaking ? "Listening" : "Listen"} · ${rate}×`}
            </Text>
          </View>
        </ScalePressable>

        <IconButton
          icon={speaking ? "pause" : "play"}
          label={speaking ? "Pause reading" : "Play reading"}
          onPress={togglePlayback}
          color={theme.colors.primary}
        />
        {onClose ? (
          <IconButton
            icon="close"
            label="Close player"
            size={20}
            onPress={closeMini}
            color={theme.colors.onSurfaceVariant}
          />
        ) : null}
      </Animated.View>

      {rendered ? (
        <View style={styles.overlay} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: theme.colors.scrim, opacity: expansion },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setExpanded(false)}
              accessibilityLabel="Close player"
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                opacity: expansion,
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
                size={30}
                onPress={() => setExpanded(false)}
              />
            </View>

            <SeekBar
              progress={progress}
              onSeek={seekToFraction}
              activeColor={theme.colors.primary}
              trackColor={theme.colors.outlineVariant}
              thumbColor={theme.colors.onPrimary}
            />

            <View style={styles.controls}>
              <IconButton
                icon="rewind-15"
                label="Previous section"
                size={28}
                color={theme.colors.onSurfaceVariant}
                onPress={() => seekBy(-1)}
              />
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
              <IconButton
                icon="fast-forward-15"
                label="Next section"
                size={28}
                color={theme.colors.onSurfaceVariant}
                onPress={() => seekBy(1)}
              />
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

/**
 * Draggable listening progress control. The thumb follows the finger and seeks
 * when released, using the same character offsets as speech playback.
 */
function SeekBar({
  progress,
  onSeek,
  activeColor,
  trackColor,
  thumbColor,
}: {
  progress: number;
  onSeek: (fraction: number) => void;
  activeColor: string;
  trackColor: string;
  thumbColor: string;
}) {
  const widthRef = useRef(0);
  const leftRef = useRef(0);
  const seekRef = useRef<ComponentRef<typeof View>>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const updateFromEvent = (pageX: number, localX: number) => {
    if (widthRef.current <= 0) {
      return;
    }
    const x = leftRef.current > 0 ? pageX - leftRef.current : localX;
    const next = Math.max(0, Math.min(1, x / widthRef.current));
    dragRef.current = next;
    setDragging(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateFromEvent(
            event.nativeEvent.pageX,
            event.nativeEvent.locationX
          );
        },
        onPanResponderMove: (event) => {
          updateFromEvent(
            event.nativeEvent.pageX,
            event.nativeEvent.locationX
          );
        },
        onPanResponderRelease: () => {
          if (dragRef.current !== null) {
            onSeekRef.current(dragRef.current);
          }
          dragRef.current = null;
          setDragging(null);
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
          setDragging(null);
        },
      }),
    []
  );

  const value = dragging ?? progress;

  return (
    <View
      ref={seekRef}
      style={styles.seekArea}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
        seekRef.current?.measureInWindow((x) => {
          leftRef.current = x;
        });
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Listening progress"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.seekTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.seekFill,
            { width: `${value * 100}%`, backgroundColor: activeColor },
          ]}
        />
        <View
          style={[
            styles.seekThumb,
            {
              left: `${value * 100}%`,
              backgroundColor: thumbColor,
              borderColor: activeColor,
            },
          ]}
        />
      </View>
    </View>
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
