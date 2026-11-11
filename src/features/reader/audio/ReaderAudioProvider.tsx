import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ReaderAudioTrack = {
  id: string;
  title: string;
  paragraphs: string[];
};

type ReaderAudioContextValue = {
  track: ReaderAudioTrack | null;
  play: (track: ReaderAudioTrack) => void;
  clear: () => void;
};

const ReaderAudioContext = createContext<ReaderAudioContextValue | null>(null);

/**
 * Holds the currently listening article above the router so playback and the
 * mini player survive leaving the reader screen.
 */
export function ReaderAudioProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<ReaderAudioTrack | null>(null);

  const play = useCallback((next: ReaderAudioTrack) => {
    setTrack((previous) => {
      if (
        previous &&
        previous.id === next.id &&
        previous.title === next.title &&
        previous.paragraphs.length === next.paragraphs.length &&
        previous.paragraphs.every(
          (paragraph, index) => paragraph === next.paragraphs[index]
        )
      ) {
        return previous;
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setTrack(null);
  }, []);

  const value = useMemo(() => ({ track, play, clear }), [clear, play, track]);

  return (
    <ReaderAudioContext.Provider value={value}>
      {children}
    </ReaderAudioContext.Provider>
  );
}

export function useReaderAudio(): ReaderAudioContextValue {
  const value = useContext(ReaderAudioContext);
  if (!value) {
    throw new Error("useReaderAudio must be used inside ReaderAudioProvider.");
  }
  return value;
}
