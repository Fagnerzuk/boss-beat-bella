import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PLAYLIST, type Track } from "./playlist";

type Ctx = {
  track: Track;
  index: number;
  isPlaying: boolean;
  volume: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
};

const MusicCtx = createContext<Ctx | null>(null);

const LS_INDEX = "bella.music.index";
const LS_VOLUME = "bella.music.volume";

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  // hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const i = Number(localStorage.getItem(LS_INDEX));
    if (!Number.isNaN(i) && i >= 0 && i < PLAYLIST.length) setIndex(i);
    const v = Number(localStorage.getItem(LS_VOLUME));
    if (!Number.isNaN(v) && v >= 0 && v <= 1) setVolumeState(v);
  }, []);

  // apply volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (typeof window !== "undefined") localStorage.setItem(LS_VOLUME, String(volume));
  }, [volume]);

  // switch source when index changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = PLAYLIST[index].url;
    if (typeof window !== "undefined") localStorage.setItem(LS_INDEX, String(index));
    if (isPlaying) a.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };
  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };
  const toggle = () => (isPlaying ? pause() : play());
  const next = () => setIndex((i) => (i + 1) % PLAYLIST.length);
  const prev = () => setIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length);
  const setVolume = (v: number) => setVolumeState(Math.max(0, Math.min(1, v)));

  return (
    <MusicCtx.Provider
      value={{
        track: PLAYLIST[index],
        index,
        isPlaying,
        volume,
        play,
        pause,
        toggle,
        next,
        prev,
        setVolume,
      }}
    >
      <audio
        ref={audioRef}
        preload="none"
        onEnded={next}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {children}
    </MusicCtx.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicCtx);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}