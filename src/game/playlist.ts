export type Track = {
  title: string;
  artist: string;
  url: string;
};

// Coloque os MP3s em /public/musicas/ com estes nomes,
// ou edite os campos `url` abaixo.
export const PLAYLIST: Track[] = [
  { title: "Papercut", artist: "Linkin Park", url: "/src/game/Papercut(MP3_160K).mp3" },
  { title: "Freak on a Leash", artist: "Korn", url: "/src/game/freak.mp3" },
  { title: "Monster", artist: "Skillet", url: "/src/game/monster.mp3" },
  { title: "For Whom the Bell Tolls", artist: "Metallica", url: "/src/game/bells.mp3" },
  { title: "I'm Not a Vampire", artist: "Falling in Reverse", url: "/src/game/vampire.mp3" },
  { title: "Sunflower", artist: "Post Malone & Swae Lee", url: "/src/game/sunflower.mp3" },
  { title: "In the End", artist: "Linkin Park", url: "/src/game/intheend.mp3" },
  { title: "Crawling", artist: "Linkin Park", url: "/src/game/crawling.mp3" },
];
