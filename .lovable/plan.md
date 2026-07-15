## Player de música estilo FIFA

Substituir o sistema de "uma música por fase" por um player global com playlist compartilhada entre todas as fases.

### Playlist
Músicas existentes + Sunflower:
1. Papercut — Linkin Park
2. Freak on a Leash — Korn
3. Monster — Skillet
4. For Whom the Bell Tolls — Metallica
5. I'm Not a Vampire — Falling in Reverse
6. Sunflower — Post Malone & Swae Lee (nova)

Os MP3s ficam em `/public/musicas/` — você coloca os arquivos e informa os nomes (ou eu uso nomes padrão como `papercut.mp3`, `sunflower.mp3` etc).

### UI (rodapé fixo, estilo FIFA)
Barra fixa no bottom da tela, presente no menu e no `/play`:

```text
 ┌────────────────────────────────────────────────┐
 │  ⟳ [disco girando]   Papercut — Linkin Park    │
 │                      ⏮  ⏯  ⏭     🔊 ▬▬●▬▬     │
 └────────────────────────────────────────────────┘
```

- Disco (vinil) girando via CSS `animation: spin` quando tocando, pausado quando pausado.
- Título da música atual.
- Botões: anterior (⏮), play/pause (⏯), próxima (⏭).
- Slider de volume + mute.
- Ao terminar uma música, toca a próxima automaticamente (loop na playlist).

### Arquitetura
- Novo contexto `MusicPlayerProvider` em `src/game/music-player.tsx` com:
  - `<audio>` global montado uma única vez no root.
  - Estado: `currentIndex`, `isPlaying`, `volume`.
  - Ações: `next()`, `prev()`, `toggle()`, `setVolume()`.
  - Persiste índice/volume em `localStorage`.
- Componente `<MusicPlayerBar />` renderizado no `__root.tsx` (aparece em todas as rotas).
- Playlist definida em `src/game/playlist.ts`.

### Remoções
- `musicUrl` e `song` deixam de ser tocados automaticamente pelo `play.tsx`.
- Remover o `<audio>` local de `play.tsx` e o `useEffect` que trocava música por boss.
- Remover a linha "🎵 Música do estágio" e o aviso de `musicUrl` faltando.
- Deixar o campo `song` no config apenas informativo (posso remover também se quiser).

### Arquivos
- criar `src/game/playlist.ts`
- criar `src/game/music-player.tsx` (context + provider + hook)
- criar `src/components/MusicPlayerBar.tsx`
- editar `src/routes/__root.tsx` (montar provider + bar)
- editar `src/routes/play.tsx` (remover audio antigo)
- editar `src/game/config.ts` (limpar `musicUrl`)

### Pergunta rápida
Você já tem os MP3s prontos para colocar em `public/musicas/`? Se sim, me diga os nomes exatos dos arquivos. Se não, eu uso convenção `papercut.mp3`, `freak.mp3`, `monster.mp3`, `bells.mp3`, `vampire.mp3`, `sunflower.mp3` e você renomeia depois.
