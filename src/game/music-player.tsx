import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PLAYLIST, type Track } from "./playlist";

type Ctx = {
  track: Track;
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

const LS_VOLUME = "bella.music.volume";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Ordem embaralhada; ao terminar o ciclo, embaralha de novo evitando repetir
// imediatamente a última música como a próxima primeira.
function buildOrder(avoidFirst?: number): number[] {
  const base = PLAYLIST.map((_, i) => i);
  if (base.length <= 1) return base;
  const order = shuffle(base);
  if (avoidFirst !== undefined && order[0] === avoidFirst) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [order, setOrder] = useState<number[]>(() => buildOrder());
  const [pos, setPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  const index = order[pos] ?? 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = Number(localStorage.getItem(LS_VOLUME));
    if (!Number.isNaN(v) && v >= 0 && v <= 1) setVolumeState(v);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (typeof window !== "undefined") localStorage.setItem(LS_VOLUME, String(volume));
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = PLAYLIST[index].url;
    if (isPlaying) a.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);
  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);
  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play]);

  const next = useCallback(() => {
    setPos((p) => {
      const np = p + 1;
      if (np >= order.length) {
        setOrder((prev) => buildOrder(prev[prev.length - 1]));
        return 0;
      }
      return np;
    });
  }, [order.length]);

  const prev = useCallback(() => {
    setPos((p) => (p - 1 + order.length) % order.length);
  }, [order.length]);

  const setVolume = useCallback((v: number) => setVolumeState(Math.max(0, Math.min(1, v))), []);

  const value = useMemo<Ctx>(
    () => ({
      track: PLAYLIST[index],
      isPlaying,
      volume,
      play,
      pause,
      toggle,
      next,
      prev,
      setVolume,
    }),
    [index, isPlaying, volume, play, pause, toggle, next, prev, setVolume],
  );

  return (
    <MusicCtx.Provider value={value}>
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