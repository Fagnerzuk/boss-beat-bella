import { BOSSES, SPECIAL_TO_ACHIEVEMENT } from "./config";
import type { AchievementKey, BossConfig, SpecialKey } from "./types";

export type GamePhase = "intro" | "combat" | "victory" | "defeat" | "ended";

export interface GameCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onDialogueChange: (line: { speaker: "bella" | "boss"; text: string } | null, index: number, total: number) => void;
  onHpChange: (playerHp: number, bossHp: number, bossMaxHp: number) => void;
  onStageChange: (stageIndex: number, boss: BossConfig) => void;
  onAchievement: (key: AchievementKey) => void;
  onSpiderTip: (tip: string) => void;
  onSpecialsChange: (unlocked: SpecialKey[]) => void;
  onNpcCheer?: (speaker: "iron" | "punk", text: string) => void;
}

interface Entity {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number;
  hp: number; maxHp: number;
  onGround: boolean;
  facing: 1 | -1;
  hitFlash: number;
}

interface Projectile { x: number; y: number; vx: number; vy: number; r: number; damage: number; from: "boss" | "player"; }

interface HitFx {
  x: number; y: number;
  age: number; life: number;
  color: string; label?: string;
  particles: { vx: number; vy: number; size: number }[];
}

const GRAVITY = 0.6;
const GROUND_Y = 360; // top of ground
const WORLD_W = 800;
const WORLD_H = 420;

const IRON_CHEERS = [
  "Continue, Bella! Você consegue!",
  "Isso! Mantém o ritmo, garota!",
  "Foco no alvo, Bella. Estou vendo daqui!",
  "Nada de desistir agora, você é fera!",
  "Respira e revida — eu acredito em você!",
];
const PUNK_CHEERS = [
  "Sem medo! Esse vilão não é páreo pra você!",
  "Vai com tudo, Bella! Faz barulho!",
  "Ritmo, ritmo! Cada golpe conta!",
  "Levanta, quebra tudo, vira o jogo!",
  "Tu é lenda, Bella! Manda ver!",
];

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cb: GameCallbacks;
  rafId = 0;
  lastTs = 0;

  stageIndex = 0;
  boss!: BossConfig;
  phase: GamePhase = "intro";

  player: Entity = this.makePlayer();
  bossEnt!: Entity;
  projectiles: Projectile[] = [];
  hitFx: HitFx[] = [];
  debug = false;
  playerAttackRange = 70;

  keys: Record<string, boolean> = {};
  controlsLocked = true;

  attackCooldown = 0;
  playerAttacking = 0;
  bossAttackTimer = 0;
  bossTeleportTimer = 0;

  unlockedSpecials: SpecialKey[] = [];
  specialCooldowns: Record<SpecialKey, number> = {
    estrelar: 0, poderoso: 0, sentido_aranha: 0, resistente: 0,
  };
  spiderSenseActive = 0;
  resistenteActive = 0;

  dialogueIndex = 0;
  combatStartedAt = 0;
  achievements = new Set<AchievementKey>();

  npcCheerTimer = 10000;
  lastCheerSpeaker: "iron" | "punk" = "punk";

  firstBossDefeated = false;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d ctx");
    this.ctx = ctx;
    this.cb = cb;
    this.bindKeys();
    this.loadStage(0);
    this.lastTs = performance.now();
    this.loop();
  }

  makePlayer(): Entity {
    return {
      x: 120, y: GROUND_Y - 60, vx: 0, vy: 0, w: 32, h: 60,
      hp: 100, maxHp: 100, onGround: true, facing: 1, hitFlash: 0,
    };
  }

  bindKeys() {
    const down = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      if (this.phase === "intro" && (e.key === "Enter" || e.key === " ")) {
        this.advanceDialogue();
      }
      if (this.phase === "combat") {
        if (e.key === "1") this.useSpecial("estrelar");
        if (e.key === "2") this.useSpecial("poderoso");
        if (e.key === "3") this.useSpecial("sentido_aranha");
        if (e.key === "4") this.useSpecial("resistente");
      }
      if (e.key.toLowerCase() === "b") this.debug = !this.debug;
    };
    const up = (e: KeyboardEvent) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    this._unbind = () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }
  _unbind: () => void = () => {};

  // Touch / button API for mobile UI
  press(action: "left" | "right" | "jump" | "attack", state: boolean) {
    const map: Record<string, string> = { left: "a", right: "d", jump: "w", attack: "j" };
    this.keys[map[action]] = state;
  }
  triggerDialogueNext() { if (this.phase === "intro") this.advanceDialogue(); }
  triggerSpecial(s: SpecialKey) { if (this.phase === "combat") this.useSpecial(s); }
  toggleDebug() { this.debug = !this.debug; return this.debug; }

  loadStage(i: number) {
    if (i >= BOSSES.length) {
      this.phase = "ended";
      this.unlockAch("muito_bom");
      this.cb.onPhaseChange("ended");
      return;
    }
    this.stageIndex = i;
    this.boss = BOSSES[i];
    this.player = this.makePlayer();
    this.bossEnt = {
      x: WORLD_W - 180, y: GROUND_Y - 80, vx: 0, vy: 0,
      w: 48, h: 80, hp: this.boss.hp, maxHp: this.boss.hp,
      onGround: this.boss.key !== "duende",
      facing: -1, hitFlash: 0,
    };
    this.projectiles = [];
    this.phase = "intro";
    this.dialogueIndex = 0;
    this.controlsLocked = true;
    this.cb.onStageChange(i, this.boss);
    this.cb.onPhaseChange("intro");
    this.cb.onDialogueChange(this.boss.intro[0], 0, this.boss.intro.length);
    this.cb.onHpChange(this.player.hp, this.bossEnt.hp, this.bossEnt.maxHp);
    // spider-punk tip
    setTimeout(() => this.cb.onSpiderTip(this.boss.tip), 600);
  }

  advanceDialogue() {
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.boss.intro.length) {
      this.startCombat();
    } else {
      this.cb.onDialogueChange(this.boss.intro[this.dialogueIndex], this.dialogueIndex, this.boss.intro.length);
    }
  }

  startCombat() {
    this.phase = "combat";
    this.controlsLocked = false;
    this.combatStartedAt = performance.now();
    this.cb.onPhaseChange("combat");
    this.cb.onDialogueChange(null, 0, 0);
  }

  unlockAch(k: AchievementKey) {
    if (this.achievements.has(k)) return;
    this.achievements.add(k);
    this.cb.onAchievement(k);
  }

  useSpecial(s: SpecialKey) {
    if (!this.unlockedSpecials.includes(s)) return;
    if (this.specialCooldowns[s] > 0) return;
    this.specialCooldowns[s] = 8000;
    if (s === "estrelar") {
      // jump + kick: leap toward boss, big damage on contact
      const dir = this.bossEnt.x > this.player.x ? 1 : -1;
      this.player.vx = 10 * dir;
      this.player.vy = -14;
      this.player.onGround = false;
      this.playerAttacking = 500;
      this.dealDamageToBossIfClose(35, 80);
    } else if (s === "poderoso") {
      // high speed punch
      this.dealDamageToBossIfClose(40, 100);
      this.playerAttacking = 300;
    } else if (s === "sentido_aranha") {
      this.spiderSenseActive = 10000;
    } else if (s === "resistente") {
      this.resistenteActive = 8000;
    }
  }

  dealDamageToBossIfClose(dmg: number, range: number) {
    const dx = Math.abs(this.player.x + this.player.w / 2 - (this.bossEnt.x + this.bossEnt.w / 2));
    const dy = Math.abs(this.player.y - this.bossEnt.y);
    this.playerAttackRange = range;
    if (dx < range && dy < 120) {
      this.bossEnt.hp -= dmg;
      this.bossEnt.hitFlash = 200;
      this.spawnHitFx(this.bossEnt.x + this.bossEnt.w/2, this.bossEnt.y + this.bossEnt.h/2, "#fff2a8", dmg);
      this.cb.onHpChange(this.player.hp, Math.max(0, this.bossEnt.hp), this.bossEnt.maxHp);
    }
  }

  loop = () => {
    const now = performance.now();
    const dt = Math.min(33, now - this.lastTs);
    this.lastTs = now;
    if (this.phase === "combat") this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dt: number) {
    // cooldowns
    for (const k of Object.keys(this.specialCooldowns) as SpecialKey[]) {
      this.specialCooldowns[k] = Math.max(0, this.specialCooldowns[k] - dt);
    }
    if (this.spiderSenseActive > 0) this.spiderSenseActive -= dt;
    if (this.resistenteActive > 0) this.resistenteActive -= dt;
    if (this.playerAttacking > 0) this.playerAttacking -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.player.hitFlash > 0) this.player.hitFlash -= dt;
    if (this.bossEnt.hitFlash > 0) this.bossEnt.hitFlash -= dt;

    // Player input
    const speed = this.resistenteActive > 0 ? 6 : 4;
    this.player.vx = 0;
    if (this.keys["a"] || this.keys["arrowleft"]) { this.player.vx = -speed; this.player.facing = -1; }
    if (this.keys["d"] || this.keys["arrowright"]) { this.player.vx = speed; this.player.facing = 1; }
    if ((this.keys["w"] || this.keys["arrowup"] || this.keys[" "]) && this.player.onGround) {
      this.player.vy = -13; this.player.onGround = false;
    }
    if ((this.keys["j"] || this.keys["f"]) && this.attackCooldown <= 0) {
      this.attackCooldown = 350;
      this.playerAttacking = 200;
      const dmg = this.resistenteActive > 0 ? 18 : 10;
      this.dealDamageToBossIfClose(dmg, 70);
    }

    // physics player
    this.player.vy += GRAVITY;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    if (this.player.y + this.player.h >= GROUND_Y) {
      this.player.y = GROUND_Y - this.player.h;
      this.player.vy = 0;
      this.player.onGround = true;
    }
    this.player.x = Math.max(10, Math.min(WORLD_W - 10 - this.player.w, this.player.x));

    // Boss AI
    this.runBossAI(dt);

    // projectiles
    for (const p of this.projectiles) {
      p.x += p.vx; p.y += p.vy;
      if (p.from === "boss") p.vy += 0.2;
    }
    this.projectiles = this.projectiles.filter(p => p.x > -20 && p.x < WORLD_W + 20 && p.y < GROUND_Y + 10);

    // hit fx update
    for (const fx of this.hitFx) {
      fx.age += dt;
      for (const pa of fx.particles) { pa.vx *= 0.94; pa.vy += 0.35; }
    }
    this.hitFx = this.hitFx.filter(fx => fx.age < fx.life);

    // proj hits player
    for (const p of this.projectiles) {
      if (p.from !== "boss") continue;
      const cx = this.player.x + this.player.w / 2;
      const cy = this.player.y + this.player.h / 2;
      if (Math.hypot(p.x - cx, p.y - cy) < p.r + 20) {
        this.hitPlayer(p.damage);
        p.x = -999;
      }
    }

    // win/lose
    if (this.bossEnt.hp <= 0 && this.phase === "combat") this.winStage();
    if (this.player.hp <= 0 && this.phase === "combat") this.lose();

    // NPCs incentivam a Bella a cada 10s
    this.npcCheerTimer -= dt;
    if (this.npcCheerTimer <= 0) {
      this.npcCheerTimer = 10000;
      const speaker: "iron" | "punk" = this.lastCheerSpeaker === "punk" ? "iron" : "punk";
      this.lastCheerSpeaker = speaker;
      const pool = speaker === "iron" ? IRON_CHEERS : PUNK_CHEERS;
      const text = pool[Math.floor(Math.random() * pool.length)];
      this.cb.onNpcCheer?.(speaker, text);
    }
  }

  runBossAI(dt: number) {
    const b = this.bossEnt;
    const dx = (this.player.x + this.player.w/2) - (b.x + b.w/2);
    b.facing = dx > 0 ? 1 : -1;
    this.bossAttackTimer -= dt;

    switch (this.boss.key) {
      case "duende": {
        // fly toward player at altitude, swoop occasionally
        const targetY = GROUND_Y - 220 + Math.sin(performance.now()/400)*30;
        b.vy = (targetY - b.y) * 0.05;
        b.vx = Math.sign(dx) * this.boss.speed;
        b.x += b.vx; b.y += b.vy;
        if (this.bossAttackTimer <= 0) {
          this.bossAttackTimer = this.boss.attackCooldown;
          // bomb
          this.projectiles.push({
            x: b.x + b.w/2, y: b.y + b.h, vx: Math.sign(dx)*3, vy: 1, r: 8, damage: this.boss.damage, from: "boss"
          });
        }
        break;
      }
      case "docock": {
        b.vx = Math.sign(dx) * this.boss.speed;
        b.x += b.vx;
        if (b.onGround) { /* ground */ } else { b.vy += GRAVITY; b.y += b.vy; }
        if (b.y + b.h >= GROUND_Y) { b.y = GROUND_Y - b.h; b.vy = 0; b.onGround = true; }
        if (Math.abs(dx) < 90 && this.bossAttackTimer <= 0) {
          this.bossAttackTimer = this.boss.attackCooldown;
          this.tryHitPlayer(this.boss.damage, 110);
        }
        break;
      }
      case "venom": {
        b.vx = Math.sign(dx) * this.boss.speed * 0.6;
        b.x += b.vx;
        if (b.onGround && this.bossAttackTimer <= 0 && Math.abs(dx) < 250) {
          this.bossAttackTimer = this.boss.attackCooldown;
          // big leap
          b.vy = -16; b.vx = Math.sign(dx) * 7; b.onGround = false;
        }
        if (!b.onGround) {
          b.vy += GRAVITY; b.y += b.vy; b.x += b.vx;
          if (b.y + b.h >= GROUND_Y) {
            b.y = GROUND_Y - b.h; b.vy = 0; b.onGround = true;
            // Impacto único no pouso: tira 1/5 da vida máxima da Bella
            if (Math.abs(dx) < 90) {
              const slam = Math.ceil(this.player.maxHp / 5);
              this.hitPlayer(slam);
            }
          }
        }
        break;
      }
      case "kingpin": {
        b.vx = Math.sign(dx) * this.boss.speed;
        b.x += b.vx;
        if (Math.abs(dx) < 80 && this.bossAttackTimer <= 0) {
          this.bossAttackTimer = this.boss.attackCooldown;
          this.tryHitPlayer(this.boss.damage, 95);
        }
        break;
      }
      case "mancha": {
        this.bossTeleportTimer -= dt;
        if (this.bossTeleportTimer <= 0) {
          this.bossTeleportTimer = 2000 + Math.random()*1500;
          // teleport near player
          const side = Math.random() < 0.5 ? -1 : 1;
          b.x = Math.max(40, Math.min(WORLD_W - 80, this.player.x + side * (120 + Math.random()*80)));
          b.y = GROUND_Y - b.h;
          b.hitFlash = 150;
        }
        // small approach
        b.vx = Math.sign(dx) * this.boss.speed * 0.5;
        b.x += b.vx;
        if (Math.abs(dx) < 70 && this.bossAttackTimer <= 0) {
          this.bossAttackTimer = this.boss.attackCooldown;
          this.tryHitPlayer(this.boss.damage, 80);
        }
        break;
      }
    }
    b.x = Math.max(20, Math.min(WORLD_W - 20 - b.w, b.x));
  }

  tryHitPlayer(dmg: number, range: number) {
    const b = this.bossEnt;
    const dx = Math.abs(this.player.x + this.player.w/2 - (b.x + b.w/2));
    if (dx < range) this.hitPlayer(dmg);
  }

  hitPlayer(dmg: number) {
    if (this.spiderSenseActive > 0) return;
    if (this.resistenteActive > 0) dmg = Math.floor(dmg * 0.5);
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.player.hitFlash = 250;
    this.spawnHitFx(this.player.x + this.player.w/2, this.player.y + this.player.h/2, "#ff5c7a", dmg);
    this.cb.onHpChange(this.player.hp, this.bossEnt.hp, this.bossEnt.maxHp);
  }

  spawnHitFx(x: number, y: number, color: string, dmg: number) {
    const parts: HitFx["particles"] = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      parts.push({ vx: Math.cos(a)*s, vy: Math.sin(a)*s - 1.5, size: 2 + Math.random()*3 });
    }
    this.hitFx.push({ x, y, age: 0, life: 550, color, label: `-${dmg}`, particles: parts });
  }

  winStage() {
    this.phase = "victory";
    this.cb.onPhaseChange("victory");
    const seconds = Math.floor((performance.now() - this.combatStartedAt) / 1000);
    if (!this.firstBossDefeated) {
      this.firstBossDefeated = true;
      this.unlockAch("firme_e_forte");
    }
    if (seconds <= 50) this.unlockAch("ligeirinho");
    // unlock special
    if (this.boss.unlocksSpecial) {
      const s = this.boss.unlocksSpecial;
      if (!this.unlockedSpecials.includes(s)) {
        this.unlockedSpecials.push(s);
        this.unlockAch("especial");
        const aKey = SPECIAL_TO_ACHIEVEMENT[s] as AchievementKey;
        if (aKey) this.unlockAch(aKey);
        this.cb.onSpecialsChange([...this.unlockedSpecials]);
      }
    }
    // last boss?
    if (this.stageIndex === BOSSES.length - 1) {
      this.unlockAch("muito_bom");
    }
  }

  lose() {
    this.phase = "defeat";
    this.cb.onPhaseChange("defeat");
    if (this.stageIndex === BOSSES.length - 1) this.unlockAch("nao_foi_dessa_vez");
  }

  nextStage() { this.loadStage(this.stageIndex + 1); }
  retryStage() { this.loadStage(this.stageIndex); }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this._unbind();
  }

  // --- Render ---
  draw() {
    const ctx = this.ctx;
    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    grad.addColorStop(0, "#1a1147");
    grad.addColorStop(1, "#4b1d6e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // distant city
    ctx.fillStyle = "#0d0626";
    for (let i = 0; i < 10; i++) {
      const w = 60 + (i*37)%50;
      const h = 80 + (i*53)%120;
      ctx.fillRect(i*85, GROUND_Y - h, w, h);
    }
    // windows
    ctx.fillStyle = "rgba(255,220,120,0.4)";
    for (let i = 0; i < 60; i++) {
      ctx.fillRect((i*53)%WORLD_W, GROUND_Y - 30 - (i*17)%140, 4, 6);
    }

    // ground
    ctx.fillStyle = "#1a0a2e";
    ctx.fillRect(0, GROUND_Y, WORLD_W, WORLD_H - GROUND_Y);
    ctx.fillStyle = "#39204d";
    ctx.fillRect(0, GROUND_Y, WORLD_W, 4);

    // NPCs de cenário
    this.drawIronMan();
    this.drawSpiderPunk();

    // boss
    this.drawBoss();
    // player
    this.drawPlayer();
    // projectiles
    for (const p of this.projectiles) {
      ctx.fillStyle = p.from === "boss" ? "#ffaa33" : "#33ddff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }

    // active special aura
    if (this.spiderSenseActive > 0) {
      ctx.strokeStyle = "rgba(255,80,80,0.7)";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.player.x - 4, this.player.y - 4, this.player.w + 8, this.player.h + 8);
    }
    if (this.resistenteActive > 0) {
      ctx.strokeStyle = "rgba(255,220,80,0.7)";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.player.x - 4, this.player.y - 4, this.player.w + 8, this.player.h + 8);
    }
  }

  drawIronMan() {
    const ctx = this.ctx;
    const t = performance.now() / 500;
    const x = WORLD_W - 90 + Math.sin(t) * 6;
    const y = 60 + Math.cos(t) * 4;
    // corpo vermelho
    ctx.fillStyle = "#b71c1c";
    ctx.fillRect(x, y + 10, 26, 26);
    // capacete
    ctx.fillStyle = "#d4a017";
    ctx.fillRect(x + 4, y, 18, 14);
    // olhos brilhando
    ctx.fillStyle = "#e0f7ff";
    ctx.fillRect(x + 7, y + 5, 4, 3);
    ctx.fillRect(x + 15, y + 5, 4, 3);
    // pernas
    ctx.fillStyle = "#b71c1c";
    ctx.fillRect(x + 4, y + 36, 8, 12);
    ctx.fillRect(x + 14, y + 36, 8, 12);
    // repulsor flames
    ctx.fillStyle = "rgba(80,180,255,0.8)";
    ctx.beginPath(); ctx.arc(x + 8, y + 50, 3 + Math.sin(t*4), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 18, y + 50, 3 + Math.cos(t*4), 0, Math.PI*2); ctx.fill();
    // label
    ctx.fillStyle = "#ffd54a";
    ctx.font = "bold 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("IRON MAN", x + 13, y - 3);
  }

  drawSpiderPunk() {
    const ctx = this.ctx;
    const t = performance.now() / 400;
    const x = 40;
    const y = 80;
    // raios dos lados
    ctx.strokeStyle = "#ffe600";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const off = Math.sin(t + i) * 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, y + i*14 + off);
      ctx.lineTo(x - 2, y + i*14 + 6 + off);
      ctx.lineTo(x - 6, y + i*14 + 8 + off);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 30, y + i*14 + off);
      ctx.lineTo(x + 24, y + i*14 + 6 + off);
      ctx.lineTo(x + 28, y + i*14 + 8 + off);
      ctx.stroke();
    }
    // corpo preto com detalhes vermelhos (moicano)
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x, y + 8, 24, 30);
    // moicano vermelho
    ctx.fillStyle = "#ff1744";
    ctx.fillRect(x + 10, y - 4, 4, 12);
    ctx.fillRect(x + 8, y - 2, 8, 6);
    // cabeça (máscara aranha)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 4, y + 2, 16, 12);
    // olhos brancos angulares
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 6, y + 6, 5, 3);
    ctx.fillRect(x + 13, y + 6, 5, 3);
    // pernas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x + 3, y + 38, 7, 10);
    ctx.fillRect(x + 14, y + 38, 7, 10);
    // label
    ctx.fillStyle = "#ff1744";
    ctx.font = "bold 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("SPIDER-PUNK", x + 12, y - 8);
  }

  drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const flash = p.hitFlash > 0 && Math.floor(p.hitFlash/60) % 2 === 0;
    // body (red jacket)
    ctx.fillStyle = flash ? "#ffffff" : "#d8324b";
    ctx.fillRect(p.x, p.y + 20, p.w, p.h - 30);
    // legs
    ctx.fillStyle = flash ? "#ffffff" : "#1a1a2e";
    ctx.fillRect(p.x + 4, p.y + p.h - 12, 10, 12);
    ctx.fillRect(p.x + p.w - 14, p.y + p.h - 12, 10, 12);
    // head
    ctx.fillStyle = flash ? "#ffffff" : "#f3c9a7";
    ctx.fillRect(p.x + 6, p.y, p.w - 12, 22);
    // hair (long black)
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(p.x + 4, p.y - 2, p.w - 8, 8);
    ctx.fillRect(p.x + 2, p.y + 4, 6, 18);
    ctx.fillRect(p.x + p.w - 8, p.y + 4, 6, 18);
    // eye direction
    ctx.fillStyle = "#1a1a2e";
    const ex = p.facing === 1 ? p.x + p.w - 12 : p.x + 8;
    ctx.fillRect(ex, p.y + 10, 3, 3);
    // attack arc
    if (this.playerAttacking > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      const ax = p.facing === 1 ? p.x + p.w : p.x - 30;
      ctx.fillRect(ax, p.y + 20, 30, 16);
    }
    // name
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("BELLA", p.x + p.w/2, p.y - 6);
  }

  drawBoss() {
    const ctx = this.ctx;
    const b = this.bossEnt;
    const flash = b.hitFlash > 0 && Math.floor(b.hitFlash/60) % 2 === 0;
    ctx.fillStyle = flash ? "#ffffff" : this.boss.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // accent (cape/details)
    ctx.fillStyle = this.boss.accent;
    ctx.fillRect(b.x + 6, b.y + 14, b.w - 12, 12);
    // eyes
    ctx.fillStyle = "#fff";
    ctx.fillRect(b.x + 10, b.y + 6, 6, 4);
    ctx.fillRect(b.x + b.w - 16, b.y + 6, 6, 4);
    // special details per boss
    if (this.boss.key === "duende") {
      // glider under boss
      ctx.fillStyle = "#7a4dff";
      ctx.beginPath();
      ctx.moveTo(b.x - 14, b.y + b.h);
      ctx.lineTo(b.x + b.w + 14, b.y + b.h);
      ctx.lineTo(b.x + b.w/2, b.y + b.h + 10);
      ctx.fill();
    } else if (this.boss.key === "docock") {
      // tentacles
      ctx.strokeStyle = "#2f3b54";
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        const sx = b.x + (i < 2 ? 4 : b.w - 4);
        const sy = b.y + 30 + (i%2)*10;
        const ex = sx + (i < 2 ? -20 : 20) * b.facing;
        const ey = sy + Math.sin(performance.now()/200 + i)*8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    } else if (this.boss.key === "venom") {
      // mouth
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(b.x + 10 + i*6, b.y + 30, 4, 8);
      }
    } else if (this.boss.key === "kingpin") {
      // suit collar white
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x + 14, b.y + 18, b.w - 28, 8);
    } else if (this.boss.key === "mancha") {
      // spots
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath(); ctx.arc(b.x + 14, b.y + 18, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(b.x + 36, b.y + 32, 7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(b.x + 20, b.y + 50, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(b.x + 38, b.y + 64, 4, 0, Math.PI*2); ctx.fill();
    }
    // name
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(this.boss.name.toUpperCase(), b.x + b.w/2, b.y - 6);
  }
}

export { WORLD_W, WORLD_H };