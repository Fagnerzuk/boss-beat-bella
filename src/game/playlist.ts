import bells from "@/assets/music/bells.mp3.asset.json";
import crawling from "@/assets/music/crawling.mp3.asset.json";
import intheend from "@/assets/music/intheend.mp3.asset.json";
import loser from "@/assets/music/loser.mp3.asset.json";
import monster from "@/assets/music/monster.mp3.asset.json";
import papercut from "@/assets/music/papercut.mp3.asset.json";
import sunflower from "@/assets/music/sunflower.mp3.asset.json";

export type Track = {
  title: string;
  artist: string;
  url: string;
};

export const PLAYLIST: Track[] = [
  { title: "Papercut", artist: "Linkin Park", url: papercut.url },
  { title: "Monster", artist: "Skillet", url: monster.url },
  { title: "For Whom the Bell Tolls", artist: "Metallica", url: bells.url },
  { title: "Sunflower", artist: "Post Malone & Swae Lee", url: sunflower.url },
  { title: "In the End", artist: "Linkin Park", url: intheend.url },
  { title: "Crawling", artist: "Linkin Park", url: crawling.url },
  { title: "Loser", artist: "Tame Impala", url: loser.url },
];
