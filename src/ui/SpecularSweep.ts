import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { Grid } from '../game/Grid';
import type { GlossyTileParts } from './GlossyTile';

const SHINE_TEX = 256;
const SHINE_FRAMES = 18;
const SHINE_KEY = 'intro-gem-specular-v2';

type Point = { x: number; y: number };

export interface SpecularSweepBoard {
  grid: Grid;
  tileSprites: GlossyTileParts[][];
  tileSize: number;
}

export interface SpecularSweepHandle {
  cancel: () => void;
}

function shineFrameKey(index: number): string {
  return `${SHINE_KEY}-${index}`;
}

function octagon(cx: number, cy: number, half: number, cut: number): Point[] {
  return [
    { x: cx - half + cut, y: cy - half },
    { x: cx + half - cut, y: cy - half },
    { x: cx + half, y: cy - half + cut },
    { x: cx + half, y: cy + half - cut },
    { x: cx + half - cut, y: cy + half },
    { x: cx - half + cut, y: cy + half },
    { x: cx - half, y: cy + half - cut },
    { x: cx - half, y: cy - half + cut },
  ];
}

function pathPoly(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

function drawShineFrame(ctx: CanvasRenderingContext2D, t: number): void {
  const cx = SHINE_TEX / 2;
  const cy = SHINE_TEX / 2 - 4;
  const s = SHINE_TEX * 0.4;
  const cut = s * 0.12;
  const table = s * 0.56;
  const outer = octagon(cx, cy, s, cut);
  const tablePts = [
    { x: cx - table, y: cy - table },
    { x: cx + table, y: cy - table },
    { x: cx + table, y: cy + table },
    { x: cx - table, y: cy + table },
  ];

  ctx.clearRect(0, 0, SHINE_TEX, SHINE_TEX);
  ctx.imageSmoothingEnabled = true;

  const envelope = Math.sin(Math.PI * t);
  if (envelope < 0.02) return;

  const streakX = cx + (t - 0.5) * s * 2.2;
  const angle = -0.5;

  const paintStreak = (peak: number, halfW: number, secondPane: boolean) => {
    ctx.save();
    ctx.translate(streakX, cy - 4);
    ctx.rotate(angle);

    const wash = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    wash.addColorStop(0, 'rgba(186, 224, 255, 0)');
    wash.addColorStop(0.34, `rgba(198, 232, 255, ${peak * 0.04})`);
    wash.addColorStop(0.45, `rgba(232, 246, 255, ${peak * 0.16})`);
    wash.addColorStop(0.49, `rgba(255, 255, 255, ${peak * 0.42})`);
    wash.addColorStop(0.5, `rgba(255, 255, 255, ${peak * 0.58})`);
    wash.addColorStop(0.51, `rgba(255, 255, 255, ${peak * 0.38})`);
    wash.addColorStop(0.56, `rgba(198, 232, 255, ${peak * 0.1})`);
    wash.addColorStop(0.7, `rgba(186, 224, 255, ${peak * 0.02})`);
    wash.addColorStop(1, 'rgba(186, 224, 255, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(-halfW, -s * 1.35, halfW * 2, s * 2.7);

    if (secondPane) {
      const x0 = halfW * 0.18;
      const pane = ctx.createLinearGradient(x0, 0, x0 + halfW * 0.16, 0);
      pane.addColorStop(0, 'rgba(255,255,255,0)');
      pane.addColorStop(0.5, `rgba(236, 248, 255, ${peak * 0.2})`);
      pane.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = pane;
      ctx.fillRect(x0, -s * 1.15, halfW * 0.16, s * 2.3);
    }

    ctx.restore();
  };

  ctx.save();
  pathPoly(ctx, outer);
  ctx.clip();
  paintStreak(0.2 * envelope, 108, false);
  ctx.restore();

  ctx.save();
  pathPoly(ctx, tablePts);
  ctx.clip();
  paintStreak(0.72 * envelope, 96, true);

  const glint = ctx.createRadialGradient(
    streakX,
    tablePts[0].y + 8,
    0,
    streakX,
    tablePts[0].y + 10,
    s * 0.42,
  );
  glint.addColorStop(0, `rgba(255, 255, 255, ${0.28 * envelope})`);
  glint.addColorStop(0.4, `rgba(210, 236, 255, ${0.08 * envelope})`);
  glint.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glint;
  ctx.fillRect(cx - table, cy - table, table * 2, table * 2);
  ctx.restore();

  ctx.globalCompositeOperation = 'destination-in';
  const falloff = ctx.createLinearGradient(0, cy - s, 0, cy + s * 0.82);
  falloff.addColorStop(0, 'rgba(0,0,0,1)');
  falloff.addColorStop(0.32, 'rgba(0,0,0,0.94)');
  falloff.addColorStop(0.62, 'rgba(0,0,0,0.38)');
  falloff.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, SHINE_TEX, SHINE_TEX);
  ctx.globalCompositeOperation = 'source-over';
}

function ensureShineFrames(scene: Phaser.Scene): void {
  if (scene.textures.exists(shineFrameKey(0))) return;

  for (let i = 0; i < SHINE_FRAMES; i++) {
    const key = shineFrameKey(i);
    const texture = scene.textures.createCanvas(key, SHINE_TEX, SHINE_TEX);
    if (!texture) continue;
    drawShineFrame(texture.getContext(), i / (SHINE_FRAMES - 1));
    texture.refresh();
  }
}

/** Irregular gap so ambient sweeps never feel like a clock. */
export function nextAmbientSweepDelay(kind: 'first' | 'rest' | 'retry'): number {
  if (kind === 'first') return Phaser.Math.Between(9000, 16000);
  if (kind === 'retry') return Phaser.Math.Between(1800, 4200);

  const roll = Math.random();
  if (roll < 0.2) return Phaser.Math.Between(22000, 34000);
  if (roll < 0.38) return Phaser.Math.Between(7000, 11000);
  return Phaser.Math.Between(12000, 20000);
}

export function playSpecularSweep(
  scene: Phaser.Scene,
  board: SpecularSweepBoard,
  onComplete?: () => void,
): SpecularSweepHandle {
  ensureShineFrames(scene);

  let cancelled = false;
  const timers: Phaser.Time.TimerEvent[] = [];
  const tweens: Phaser.Tweens.Tween[] = [];
  const sprites: Phaser.GameObjects.GameObject[] = [];

  const finishAll = () => {
    if (!cancelled) onComplete?.();
  };

  let remaining = CONFIG.GRID_ROWS * CONFIG.GRID_COLS;
  const finishOne = () => {
    remaining--;
    if (remaining <= 0) finishAll();
  };

  for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
    for (let col = 0; col < CONFIG.GRID_COLS; col++) {
      const delay = col * 56 + row * 12;
      const timer = scene.time.delayedCall(delay, () => {
        if (cancelled || !scene.sys.isActive()) {
          finishOne();
          return;
        }

        if (!board.grid.getCell(col, row)) {
          finishOne();
          return;
        }

        const shine = scene.add
          .image(0, 0, shineFrameKey(0))
          .setDisplaySize(board.tileSize, board.tileSize)
          .setBlendMode(Phaser.BlendModes.ADD);
        board.tileSprites[row][col].container.add(shine);
        sprites.push(shine);

        const playback = { frame: 0 };
        const tween = scene.tweens.add({
          targets: playback,
          frame: SHINE_FRAMES - 1,
          duration: 620,
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            if (!shine.active) return;
            shine.setTexture(shineFrameKey(Math.round(playback.frame)));
          },
          onComplete: () => {
            shine.destroy();
            finishOne();
          },
        });
        tweens.push(tween);
      });
      timers.push(timer);
    }
  }

  return {
    cancel: () => {
      cancelled = true;
      timers.forEach((timer) => timer.destroy());
      tweens.forEach((tween) => tween.stop());
      sprites.forEach((sprite) => sprite.destroy());
    },
  };
}

/** Sporadic board sweeps during live play. Skips while busy, paused, or reduced-motion. */
export class AmbientSpecularSweep {
  private timer: Phaser.Time.TimerEvent | null = null;
  private handle: SpecularSweepHandle | null = null;

  constructor(
    private scene: Phaser.Scene,
    private canPlay: () => boolean,
    private getBoard: () => SpecularSweepBoard,
  ) {}

  armAfterIntro(): void {
    this.stop();
    if (!this.canPlay()) return;
    this.schedule(nextAmbientSweepDelay('first'));
  }

  cancelActive(): void {
    const hadSweep = this.handle !== null;
    this.handle?.cancel();
    this.handle = null;
    if (hadSweep && !this.timer && this.scene.sys.isActive()) {
      this.schedule(nextAmbientSweepDelay('rest'));
    }
  }

  stop(): void {
    this.timer?.destroy();
    this.timer = null;
    this.handle?.cancel();
    this.handle = null;
  }

  private schedule(delay: number): void {
    this.timer?.destroy();
    this.timer = this.scene.time.delayedCall(delay, () => this.tryPlay());
  }

  private tryPlay(): void {
    this.timer = null;
    if (!this.scene.sys.isActive()) return;
    if (!this.canPlay()) {
      this.schedule(nextAmbientSweepDelay('retry'));
      return;
    }

    this.handle = playSpecularSweep(this.scene, this.getBoard(), () => {
      this.handle = null;
      if (this.scene.sys.isActive() && this.canPlay()) {
        this.schedule(nextAmbientSweepDelay('rest'));
      } else if (this.scene.sys.isActive()) {
        this.schedule(nextAmbientSweepDelay('retry'));
      }
    });
  }
}
