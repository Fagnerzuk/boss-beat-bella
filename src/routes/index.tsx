import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureProgress, fetchLeaderboard, getPlayerName, setPlayerName } from "@/game/persistence";
import { BOSSES } from "@/game/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Projeto Bella — Ação 2D" },
      { name: "description", content: "Enfrente os grandes chefões do crime em combates de arena 2D inspirados em Dan the Man." },
      { property: "og:title", content: "Projeto Bella — Ação 2D" },
      { property: "og:description", content: "Enfrente os grandes chefões do crime em combates de arena 2D inspirados em Dan the Man." },
    ],
  }),
  component: Index,
});

function Index() {
  const [name, setName] = useState("Bella");
  const [board, setBoard] = useState<Array<{player_name: string; max_stage: number}>>([]);

  useEffect(() => {
    setName(getPlayerName());
    ensureProgress();
    fetchLeaderboard().then(b => setBoard(b as any));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#3b0f5e] to-[#0a0418] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#ff3859] drop-shadow-[0_0_20px_rgba(255,56,89,0.5)]">
            PROJETO BELLA
          </h1>
          <p className="mt-3 text-lg text-purple-200">Ação 2D · Cinco chefões · Uma heroína</p>
        </header>

        <div className="mt-10 rounded-2xl border border-purple-700/40 bg-black/40 p-6 backdrop-blur">
          <label className="block text-sm uppercase tracking-wider text-purple-300">Seu nome no leaderboard</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setPlayerName(name || "Bella")}
            maxLength={20}
            className="mt-2 w-full rounded-lg bg-purple-950/60 px-4 py-3 text-lg outline-none ring-2 ring-purple-700/40 focus:ring-[#ff3859]"
          />
          <Link
            to="/play"
            onClick={() => setPlayerName(name || "Bella")}
            className="mt-4 block w-full rounded-xl bg-[#ff3859] py-4 text-center text-2xl font-black uppercase tracking-wider shadow-[0_8px_0_#7a0a20] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_#7a0a20]"
          >
            ► Começar a jogar
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-purple-200">Os chefões</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BOSSES.map((b, i) => (
              <div key={b.key} className="flex items-center gap-3 rounded-xl border border-purple-700/30 bg-black/30 p-3">
                <div className="h-10 w-10 rounded" style={{ background: b.color, boxShadow: `0 0 12px ${b.color}88` }} />
                <div>
                  <div className="font-bold">{i+1}. {b.name}</div>
                  <div className="text-xs text-purple-300">{b.song}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-purple-200">🏆 Ranking</h2>
          <div className="mt-3 rounded-xl border border-purple-700/30 bg-black/30 p-3">
            {board.length === 0 && <p className="text-purple-300 text-sm">Ninguém jogou ainda. Seja o primeiro!</p>}
            {board.map((row, i) => (
              <div key={i} className="flex justify-between border-b border-purple-800/40 py-1.5 last:border-0">
                <span><span className="text-purple-400 mr-2">#{i+1}</span>{row.player_name}</span>
                <span className="text-[#ff3859] font-bold">Estágio {row.max_stage + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-purple-700/30 bg-black/30 p-4 text-sm text-purple-200">
          <h3 className="font-bold mb-1">Controles</h3>
          <p>Teclado: <b>A/D</b> ou ←/→ andar · <b>W</b> ou ↑/espaço pular · <b>J</b> ou <b>F</b> atacar · <b>Enter</b> avançar diálogo · <b>1–4</b> usar especiais desbloqueados</p>
          <p className="mt-1">No celular use os botões na tela.</p>
        </section>
      </div>
    </div>
  );
}
