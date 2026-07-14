import bella from "@/assets/sprites/bella.png";
import duende from "@/assets/sprites/duende.png";
import docock from "@/assets/sprites/docock.png";
import venom from "@/assets/sprites/venom.png";
import kingpin from "@/assets/sprites/kingpin.png";
import mancha from "@/assets/sprites/mancha.png";
import ironman from "@/assets/sprites/ironman.png";
import spiderpunk from "@/assets/sprites/spiderpunk.png";
import type { BossKey } from "./types";

function load(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

export const SPRITES = {
  bella: load(bella),
  ironman: load(ironman),
  spiderpunk: load(spiderpunk),
  bosses: {
    duende: load(duende),
    docock: load(docock),
    venom: load(venom),
    kingpin: load(kingpin),
    mancha: load(mancha),
  } as Record<BossKey, HTMLImageElement>,
};

/** Draws image scaled to fit box while preserving aspect. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  facing: 1 | -1 = 1,
  flash = false,
) {
  if (!img.complete || img.naturalWidth === 0) {
    ctx.fillStyle = flash ? "#fff" : "#888";
    ctx.fillRect(x, y, w, h);
    return;
  }
  const ar = img.naturalWidth / img.naturalHeight;
  let dw = w, dh = h;
  if (ar > w / h) { dh = w / ar; } else { dw = h * ar; }
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh);
  ctx.save();
  if (facing === -1) {
    ctx.translate(dx + dw / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(dx + dw / 2), 0);
  }
  if (flash) {
    ctx.filter = "brightness(4)";
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}