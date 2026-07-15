import { useMusicPlayer } from "@/game/music-player";

export function MusicPlayerBar() {
  const { track, isPlaying, volume, toggle, next, prev, setVolume } = useMusicPlayer();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-purple-700/50 bg-gradient-to-r from-[#1a0a2e]/95 to-[#0a0418]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2">
        {/* Vinyl */}
        <div className="relative h-12 w-12 shrink-0">
          <div
            className={`h-12 w-12 rounded-full border-2 border-purple-500/60 bg-[radial-gradient(circle,#3b0f5e_0%,#0a0418_45%,#1a0a2e_55%,#0a0418_100%)] shadow-[0_0_10px_rgba(255,56,89,0.4)] ${
              isPlaying ? "animate-[spin_3s_linear_infinite]" : ""
            }`}
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px), radial-gradient(circle, #3b0f5e 0%, #0a0418 60%)",
            }}
          >
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff3859] shadow-[0_0_6px_#ff3859]" />
          </div>
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{track.title}</div>
          <div className="truncate text-[10px] text-purple-300">{track.artist}</div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            aria-label="Música anterior"
            className="rounded-full p-2 text-white hover:bg-purple-700/40"
          >
            ⏮
          </button>
          <button
            onClick={toggle}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            className="rounded-full bg-[#ff3859] p-2 text-white shadow-[0_2px_0_#7a0a20] hover:brightness-110"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={next}
            aria-label="Próxima música"
            className="rounded-full p-2 text-white hover:bg-purple-700/40"
          >
            ⏭
          </button>
        </div>

        {/* Volume */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs">{volume === 0 ? "🔇" : "🔊"}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="w-20 accent-[#ff3859]"
          />
        </div>
      </div>
    </div>
  );
}