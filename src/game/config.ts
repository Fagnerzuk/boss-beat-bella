import type { AchievementConfig, BossConfig } from "./types";

export const BOSSES: BossConfig[] = [
  {
    key: "duende",
    name: "Duende Verde",
    color: "#3aa84a",
    accent: "#9b4dff",
    hp: 100,
    speed: 2.8,
    damage: 8,
    attackCooldown: 1400,
    song: "Papercut — Linkin Park",
    tip: "Ele voa! Pule e ataque quando estiver passando por cima.",
    unlocksSpecial: "estrelar",
    intro: [
      { speaker: "boss", text: "Hahaha! Olhe só, a pequena Bella veio brincar comigo." },
      { speaker: "bella", text: "Acabou a brincadeira, Duende. Hoje você cai." },
      { speaker: "boss", text: "Veremos quem cai primeiro do meu planador!" },
    ],
  },
  {
    key: "docock",
    name: "Doutor Octopus",
    color: "#c47a16",
    accent: "#2f3b54",
    hp: 130,
    speed: 2.0,
    damage: 12,
    attackCooldown: 1200,
    song: "Freak on a Leash — Korn",
    tip: "Os tentáculos têm alcance médio. Fique colado nele OU bem longe.",
    unlocksSpecial: "poderoso",
    intro: [
      { speaker: "boss", text: "Meus tentáculos vão te esmagar, menina." },
      { speaker: "bella", text: "Quatro braços e ainda assim você é lento." },
    ],
  },
  {
    key: "venom",
    name: "Venom",
    color: "#1a1a1a",
    accent: "#e6e6e6",
    hp: 170,
    speed: 2.4,
    damage: 16,
    attackCooldown: 1100,
    song: "Monster — Skillet",
    tip: "Cuidado com os saltos! Quando ele pula, role para o lado.",
    unlocksSpecial: "sentido_aranha",
    intro: [
      { speaker: "boss", text: "NÓS SOMOS VENOM. NÓS TE DEVORAMOS." },
      { speaker: "bella", text: "Falar no plural não te deixa mais forte." },
    ],
  },
  {
    key: "kingpin",
    name: "Rei do Crime",
    color: "#5a3f8a",
    accent: "#f0e1a0",
    hp: 220,
    speed: 1.4,
    damage: 20,
    attackCooldown: 1500,
    song: "For Whom the Bell Tolls — Metallica",
    tip: "Lento mas devastador. Ataque-acerte-recua, nunca fique parado perto.",
    unlocksSpecial: "resistente",
    intro: [
      { speaker: "boss", text: "Eu sou o Rei. Esta cidade me pertence." },
      { speaker: "bella", text: "Sua coroa cai hoje, gordinho." },
      { speaker: "boss", text: "Insolente!" },
    ],
  },
  {
    key: "mancha",
    name: "Mancha",
    color: "#f5f5f5",
    accent: "#0a0a0a",
    hp: 200,
    speed: 3.2,
    damage: 14,
    attackCooldown: 900,
    song: "I'm Not a Vampire — Falling in Reverse",
    tip: "Ele se teleporta! Fique de olho onde ele reaparece e ataque rápido.",
    intro: [
      { speaker: "boss", text: "Aqui... ali... em todo lugar!" },
      { speaker: "bella", text: "Pare de fugir e enfrente, palhaço!" },
    ],
  },
];

export const ACHIEVEMENTS: AchievementConfig[] = [
  { key: "firme_e_forte", title: "Firme e forte", description: "Derrotou seu primeiro chefe." },
  { key: "ligeirinho", title: "Ligeirinho", description: "Derrotou um chefe em menos de 50 segundos." },
  { key: "especial", title: "Especial!", description: "Desbloqueou seu primeiro especial." },
  { key: "valente", title: "Valente!", description: "Conseguiu o especial Sentido Aranha." },
  { key: "imbativel", title: "Imbatível!", description: "Conseguiu o especial Estrelar." },
  { key: "inabalavel", title: "Inabalável!", description: "Conseguiu o especial Poderoso." },
  { key: "infalivel", title: "Infalível!", description: "Conseguiu o especial Resistente." },
  { key: "muito_bom", title: "Muito bom!", description: "Chegou até o final do jogo." },
  { key: "nao_foi_dessa_vez", title: "Não foi dessa vez", description: "Foi derrotado pelo último chefe." },
];

export const SPECIAL_NAMES: Record<string, string> = {
  estrelar: "Estrelar",
  poderoso: "Poderoso",
  sentido_aranha: "Sentido Aranha",
  resistente: "Resistente",
};

export const SPECIAL_TO_ACHIEVEMENT: Record<string, string> = {
  estrelar: "imbativel",
  poderoso: "inabalavel",
  sentido_aranha: "valente",
  resistente: "infalivel",
};