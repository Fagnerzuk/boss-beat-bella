import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GameEngine, WORLD_W, WORLD_H, type GamePhase } from "@/game/engine";
import type { AchievementKey, BossConfig, SpecialKey } from "@/game/types";
import { ACHIEVEMENTS, SPECIAL_NAMES } from "@/game/config";
import { logAchievement, logRun, saveProgress, ensureProgress } from "@/game/persistence";
import { unlockAudio } from "@/game/sfx";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Jogar — Projeto Bella" },
      { name: "description", content: "Combate em arena 2D contra os grandes vilões." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [dialogue, setDialogue] = useState<{ speaker: "bella"|"boss"; text: string} | null>(null);
  const [dialogueIdx, setDialogueIdx] = useState({ i: 0, total: 0 });
  const [boss, setBoss] = useState<BossConfig | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [bossMaxHp, setBossMaxHp] = useState(100);
  const [specials, setSpecials] = useState<SpecialKey[]>([]);
  const [achToast, setAchToast] = useState<{ title: string; remaining: number} | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [cheer, setCheer] = useState<{ speaker: "iron" | "punk"; text: string } | null>(null);
  const combatStartRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [debug, setDebug] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  // Toca a música do estágio quando o combate começa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !boss) return;
    if (phase === "combat" && boss.musicUrl) {
      if (audio.src !== boss.musicUrl) audio.src = boss.musicUrl;
      audio.loop = true;
      audio.volume = 0.35;
      audio.play().catch(() => { /* autoplay pode ser bloqueado até 1º clique */ });
    } else {
      audio.pause();
    }
  }, [phase, boss]);

  useEffect(() => {
    ensureProgress();
    if (!canvasRef.current) return;
    let engine: GameEngine;
    try {
      engine = new GameEngine(canvasRef.current, {
      onPhaseChange: (p) => {
        setPhase(p);
        if (p === "combat") combatStartRef.current = performance.now();
        if (p === "victory" && engine.boss) {
          const secs = Math.floor((performance.now() - combatStartRef.current)/1000);
          logRun(engine.boss.key, true, secs);
          saveProgress(engine.stageIndex + 1, engine.stageIndex + 1);
        }
        if (p === "defeat" && engine.boss) {
          const secs = Math.floor((performance.now() - combatStartRef.current)/1000);
          logRun(engine.boss.key, false, secs);
        }
      },
      onDialogueChange: (l, i, t) => { setDialogue(l); setDialogueIdx({ i, total: t }); },
      onHpChange: (p, b, bm) => { setPlayerHp(p); setBossHp(b); setBossMaxHp(bm); },
      onStageChange: (i, b) => { setStageIdx(i); setBoss(b); },
      onAchievement: (k) => {
        const cfg = ACHIEVEMENTS.find(a => a.key === k);
        if (!cfg) return;
        const remaining = ACHIEVEMENTS.length - (engine.achievements.size);
        setAchToast({ title: cfg.title, remaining });
        logAchievement(k);
        setTimeout(() => setAchToast(null), 3500);
      },
      onSpiderTip: (t) => {
        setTip(t);
        setTimeout(() => setTip(null), 4500);
      },
      onNpcCheer: (speaker, text) => {
        setCheer({ speaker, text });
        setTimeout(() => setCheer((c) => (c && c.text === text ? null : c)), 4000);
      },
      onSpecialsChange: (s) => setSpecials(s),
      });
      engineRef.current = engine;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("GameEngine boot failed", e);
      setBootError(msg);
    }
    return () => { engineRef.current?.destroy(); engineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hold = (action: "left"|"right"|"jump"|"attack", state: boolean) =>
    engineRef.current?.press(action, state);

  return (
    <div
      className="min-h-screen bg-[#0a0418] text-white flex flex-col items-center select-none"
      onPointerDown={() => unlockAudio()}
      onKeyDown={() => unlockAudio()}
    >
      <div className="w-full max-w-[800px] px-2 py-2 flex justify-between items-center">
        <Link to="/" className="text-sm text-purple-300 hover:text-white">← Menu</Link>
        <div className="text-xs text-purple-300">Estágio {stageIdx + 1} / 5</div>
      </div>

      {/* HUD */}
      <div className="w-full max-w-[800px] px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#ff3859] w-12">BELLA</span>
          <div className="flex-1 h-4 bg-black/60 rounded overflow-hidden border border-purple-700/40">
            <div className="h-full bg-gradient-to-r from-[#ff3859] to-[#ff8080] transition-all" style={{ width: `${playerHp}%` }} />
          </div>
          <span className="text-xs w-10 text-right">{playerHp}</span>
        </div>
        {phase === "combat" && boss && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold w-12 truncate" style={{ color: boss.color }}>{boss.name.split(" ")[0].toUpperCase()}</span>
            <div className="flex-1 h-3 bg-black/60 rounded overflow-hidden border border-purple-700/40">
              <div className="h-full transition-all" style={{ width: `${(bossHp/bossMaxHp)*100}%`, background: boss.color }} />
            </div>
            <span className="text-xs w-10 text-right">{Math.max(0, bossHp)}</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-[800px] mt-2 aspect-[800/420] bg-black rounded-lg overflow-hidden border-2 border-purple-700/40">
        <canvas
          ref={canvasRef}
          width={WORLD_W}
          height={WORLD_H}
          className="w-full h-full block"
        />

        {bootError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center bg-black/90">
            <h3 className="text-lg font-bold text-[#ff3859]">Falha ao iniciar o jogo</h3>
            <p className="text-xs text-purple-200 break-all">{bootError}</p>
            <button
              onClick={() => location.reload()}
              className="mt-2 rounded-lg bg-[#ff3859] px-4 py-2 text-sm font-bold"
            >Recarregar</button>
          </div>
        )}

        {/* Dialogue overlay */}
        {phase === "intro" && dialogue && (
          <div
            className="absolute inset-x-3 bottom-3 rounded-lg border-2 bg-black/85 p-3 cursor-pointer"
            style={{ borderColor: dialogue.speaker === "bella" ? "#ff3859" : (boss?.color ?? "#fff") }}
            onClick={() => engineRef.current?.triggerDialogueNext()}
          >
            <div className="text-xs font-bold mb-1" style={{ color: dialogue.speaker === "bella" ? "#ff3859" : (boss?.color ?? "#fff") }}>
              {dialogue.speaker === "bella" ? "BELLA" : boss?.name.toUpperCase()}
            </div>
            <div className="text-sm md:text-base leading-snug">{dialogue.text}</div>
            <div className="text-[10px] text-purple-300 mt-1 text-right">
              {dialogueIdx.i + 1}/{dialogueIdx.total} · toque/Enter para avançar ►
            </div>
          </div>
        )}

        {/* Spider-Punk tip */}
        {tip && phase === "combat" && (
          <div className="absolute top-3 left-3 right-3 rounded-md border border-yellow-400 bg-black/85 p-2 animate-in fade-in slide-in-from-top">
            <div className="text-[10px] font-bold text-yellow-300">⚡ SPIDER-PUNK ⚡</div>
            <div className="text-xs md:text-sm">{tip}</div>
          </div>
        )}

        {/* Frase motivacional dos NPCs */}
        {cheer && phase === "combat" && (
          <div
            className={`absolute ${cheer.speaker === "iron" ? "top-16 right-3" : "top-16 left-3"} max-w-[55%] rounded-md border-2 p-2 bg-black/85 animate-in fade-in ${
              cheer.speaker === "iron" ? "border-[#d4a017]" : "border-[#ff1744]"
            }`}
          >
            <div className={`text-[10px] font-bold ${cheer.speaker === "iron" ? "text-[#ffd54a]" : "text-[#ff5c7a]"}`}>
              {cheer.speaker === "iron" ? "🤖 IRON MAN" : "⚡ SPIDER-PUNK"}
            </div>
            <div className="text-xs md:text-sm">{cheer.text}</div>
          </div>
        )}

        {/* Achievement (Iron Man) */}
        {achToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-lg border-2 border-yellow-400 bg-gradient-to-r from-[#a01818] to-[#d4a017] px-4 py-2 shadow-xl animate-in fade-in zoom-in">
            <div className="text-[10px] font-bold text-yellow-200">🤖 IRON MAN diz:</div>
            <div className="font-black text-white">CONQUISTA: {achToast.title}</div>
            <div className="text-xs text-yellow-100">Faltam {achToast.remaining} conquistas!</div>
          </div>
        )}

        {/* Victory overlay */}
        {phase === "victory" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-black text-[#ffeb3b] drop-shadow-lg">VITÓRIA!</h2>
            <p className="text-purple-200">{boss?.name} foi derrotado!</p>
            {boss?.unlocksSpecial && (
              <p className="text-yellow-300 font-bold">✨ Especial desbloqueado: {SPECIAL_NAMES[boss.unlocksSpecial]}</p>
            )}
            <button
              onClick={() => engineRef.current?.nextStage()}
              className="rounded-lg bg-[#ff3859] px-6 py-3 font-bold text-lg hover:scale-105 transition"
            >
              {stageIdx >= 4 ? "Ver final" : "Próximo chefe ►"}
            </button>
          </div>
        )}

        {/* Defeat overlay */}
        {phase === "defeat" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4">
            <h2 className="text-4xl font-black text-[#ff3859]">GAME OVER</h2>
            <p className="text-purple-200">Bella foi derrotada por {boss?.name}.</p>
            <div className="flex gap-3">
              <button onClick={() => engineRef.current?.retryStage()} className="rounded-lg bg-[#ff3859] px-5 py-3 font-bold hover:scale-105 transition">
                Tentar de novo
              </button>
              <Link to="/" className="rounded-lg border border-purple-500 px-5 py-3 font-bold hover:bg-purple-500/20">
                Menu
              </Link>
            </div>
          </div>
        )}

        {/* Ended */}
        {phase === "ended" && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-yellow-300">VOCÊ SALVOU A CIDADE!</h2>
            <p className="text-purple-200">Todos os chefões foram derrotados. Bella é uma lenda.</p>
            <Link to="/" className="mt-3 rounded-lg bg-[#ff3859] px-6 py-3 font-bold">Voltar ao menu</Link>
          </div>
        )}
      </div>

      {/* Specials bar */}
      {phase === "combat" && (
        <div className="w-full max-w-[800px] px-3 mt-2 flex flex-wrap gap-2 justify-center">
          {(["estrelar","poderoso","sentido_aranha","resistente"] as SpecialKey[]).map((s, i) => {
            const unlocked = specials.includes(s);
            return (
              <button
                key={s}
                onClick={() => engineRef.current?.triggerSpecial(s)}
                disabled={!unlocked}
                className={`px-3 py-2 rounded text-xs font-bold border ${
                  unlocked
                    ? "bg-yellow-500/20 border-yellow-400 text-yellow-100 hover:bg-yellow-500/40"
                    : "bg-gray-800/40 border-gray-700 text-gray-500"
                }`}
              >
                [{i+1}] {SPECIAL_NAMES[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile controls */}
      {phase === "combat" && (
        <div className="w-full max-w-[800px] px-3 mt-3 flex justify-between md:hidden">
          <div className="flex gap-2">
            <TouchBtn label="◄" onPress={(s) => hold("left", s)} />
            <TouchBtn label="►" onPress={(s) => hold("right", s)} />
          </div>
          <div className="flex gap-2">
            <TouchBtn label="PULAR" onPress={(s) => hold("jump", s)} />
            <TouchBtn label="SOCO" onPress={(s) => hold("attack", s)} variant="red" />
          </div>
        </div>
      )}

      <p className="text-[10px] text-purple-400 mt-2 px-3 text-center max-w-[800px]">
        🎵 Música do estágio: <em>{boss?.song}</em>
        {boss && !boss.musicUrl && (
          <> — <span className="text-yellow-300">defina <code>musicUrl</code> em <code>src/game/config.ts</code> com a URL do seu MP3</span></>
        )}
      </p>

      <audio ref={audioRef} muted={muted} preload="none" />
      <div className="fixed bottom-3 right-3 flex flex-col gap-2">
        <button
          onClick={() => setMuted(m => !m)}
          className="rounded-full bg-black/70 border border-purple-500 text-white px-3 py-2 text-xs"
        >
          {muted ? "🔇 Som" : "🔊 Som"}
        </button>
        <button
          onClick={() => { const on = engineRef.current?.toggleDebug() ?? false; setDebug(on); }}
          className={`rounded-full border px-3 py-2 text-xs ${debug ? "bg-[#00ff88] text-black border-[#00ff88]" : "bg-black/70 border-purple-500 text-white"}`}
          title="Tecla B também alterna"
        >
          🐞 Debug {debug ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}

function TouchBtn({ label, onPress, variant }: { label: string; onPress: (state: boolean) => void; variant?: "red" }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onPress(true); }}
      onTouchEnd={(e) => { e.preventDefault(); onPress(false); }}
      onMouseDown={() => onPress(true)}
      onMouseUp={() => onPress(false)}
      onMouseLeave={() => onPress(false)}
      className={`select-none px-5 py-4 rounded-xl font-black text-white border-2 active:scale-95 transition ${
        variant === "red"
          ? "bg-[#ff3859] border-[#7a0a20] shadow-[0_4px_0_#7a0a20]"
          : "bg-purple-600 border-purple-900 shadow-[0_4px_0_#3a0a55]"
      }`}
    >{label}</button>
  );
}