export type Track = {
  title: string;
  artist: string;
  url: string;
};

// Coloque os MP3s em /public/musicas/ com estes nomes,
// ou edite os campos `url` abaixo.
export const PLAYLIST: Track[] = [
  { title: "Papercut", artist: "Linkin Park", url: "/musicas/papercut.mp3" },
  { title: "Freak on a Leash", artist: "Korn", url: "/musicas/freak.mp3" },
  { title: "Monster", artist: "Skillet", url: "/musicas/monster.mp3" },
  { title: "For Whom the Bell Tolls", artist: "Metallica", url: "/musicas/bells.mp3" },
  { title: "I'm Not a Vampire", artist: "Falling in Reverse", url: "/musicas/vampire.mp3" },
  { title: "Sunflower", artist: "Post Malone & Swae Lee", url: "/musicas/sunflower.mp3" },
  { title: "In the End", artist: "Linkin Park", url: "/musicas/intheend.mp3" },
  { title: "Crawling", artist: "Linkin Park", url: "/musicas/crawling.mp3" },
];