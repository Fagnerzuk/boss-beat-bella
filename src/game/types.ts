export type BossKey = "duende" | "docock" | "venom" | "kingpin" | "mancha";
export type SpecialKey = "estrelar" | "poderoso" | "sentido_aranha" | "resistente";
export type AchievementKey =
  | "ligeirinho"
  | "especial"
  | "firme_e_forte"
  | "muito_bom"
  | "nao_foi_dessa_vez"
  | "imbativel"
  | "inabalavel"
  | "valente"
  | "infalivel";

export interface BossConfig {
  key: BossKey;
  name: string;
  color: string;
  accent: string;
  hp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  song: string;
  /** URL do MP3 tocado em loop no combate. Troque pelos seus arquivos. */
  musicUrl?: string;
  tip: string;
  intro: { speaker: "bella" | "boss"; text: string }[];
  /** descoberta que aparece ao derrotar */
  unlocksSpecial?: SpecialKey;
}

export interface AchievementConfig {
  key: AchievementKey;
  title: string;
  description: string;
}