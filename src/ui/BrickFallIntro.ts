import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { Grid } from '../game/Grid';
import type { ContrastMode } from '../accessibility/ContrastMode';
import type { GlossyTileParts } from './GlossyTile';
import type { GameLayout } from './GameLayout';
import { resetTileVisualState } from './TilePhysics';

const SPAWN_STAGGER_MS = 18;
const RAIN_DURATION_MS = 420;

interface GridSlot {
  col: number;
  row: number;
}

interface BrickFallIntroConfig {
  layout: GameLayout;
  grid: Grid;
  contrast: ContrastMode;
  tileSprites: GlossyTileParts[][];
  getTilePosition: (col: number, row: number) => { x: number; y: number };
  onComplete: () => void;
}

function shuffleSlots(slots: GridSlot[]): GridSlot[] {
  const copy = [...slots];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Press-to-start intro: tiles rain into their grid slots, then gameplay begins. */
export class BrickFallIntro {
  private scene: Phaser.Scene;
  private config: BrickFallIntroConfig;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private started = false;
  private destroyed = false;
  private pendingTimers: Phaser.Time.TimerEvent[] = [];
  private shineSprites: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, config: BrickFallIntroConfig) {
    this.scene = scene;
    this.config = config;
  }

  show(): void {
    const { width, height } = this.scene.scale;
    const { uiScale } = this.config.layout;

    const shade = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x050010, 0.45)
      .setDepth(78)
      .setInteractive({ useHandCursor: true });
    this.ui.push(shade);

    const title = this.scene.add
      .text(width / 2, height * 0.45, 'TAP TO START', {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: `${Math.round(36 * uiScale)}px`,
        color: '#ffffff',
        stroke: '#ff00ff',
        strokeThickness: Math.round(5 * uiScale),
      })
      .setOrigin(0.5)
      .setDepth(79);
    this.ui.push(title);

    if (!this.config.contrast.isReducedMotion()) {
      this.scene.tweens.add({
        targets: title,
        scale: 1.06,
        alpha: 0.72,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const begin = () => {
      if (this.started || this.destroyed) return;
      this.started = true;
      this.clearUi();
      this.playBrickRainIntro();
    };

    shade.on('pointerdown', begin);
    this.scene.input.keyboard?.once('keydown-SPACE', begin);
    this.scene.input.keyboard?.once('keydown-ENTER', begin);
  }

  destroy(): void {
    this.destroyed = true;
    this.clearUi();
    this.pendingTimers.forEach((timer) => timer.destroy());
    this.pendingTimers = [];
    this.shineSprites.forEach((shine) => {
      this.scene.tweens.killTweensOf(shine);
      shine.destroy();
    });
    this.shineSprites = [];

    for (const row of this.config.tileSprites) {
      for (const parts of row) {
        this.scene.tweens.killTweensOf(parts.container);
      }
    }
  }

  private clearUi(): void {
    this.ui.forEach((object) => object.destroy());
    this.ui = [];
  }

  private playBrickRainIntro(): void {
    this.scene.time.paused = false;
    this.scene.tweens.resumeAll();

    const { tileSprites, getTilePosition, layout, contrast } = this.config;
    const reduced = contrast.isReducedMotion();
    const slots = shuffleSlots(
      Array.from({ length: CONFIG.GRID_ROWS * CONFIG.GRID_COLS }, (_, index) => ({
        col: index % CONFIG.GRID_COLS,
        row: Math.floor(index / CONFIG.GRID_COLS),
      })),
    );

    let pending = slots.length;
    const finishSlot = () => {
      pending--;
      if (pending === 0) this.playLandingShine();
    };

    if (!reduced) {
      this.scene.time.delayedCall(280, () => {
        if (this.destroyed) return;
        this.scene.cameras.main.shake(180, 0.005 * layout.uiScale);
      });
    }

    slots.forEach((slot, index) => {
      const delay = reduced
        ? (slot.row * CONFIG.GRID_COLS + slot.col) * 16
        : index * SPAWN_STAGGER_MS;

      const timer = this.scene.time.delayedCall(delay, () => {
        if (this.destroyed) return;

        const parts = tileSprites[slot.row][slot.col];
        const target = getTilePosition(slot.col, slot.row);
        const jitterX = reduced
          ? 0
          : Phaser.Math.Between(
              Math.round(-layout.tileSize * 0.28),
              Math.round(layout.tileSize * 0.28),
            );
        const startY = reduced
          ? target.y - layout.tileSize * 0.45
          : -layout.tileSize * 1.5 -
            Phaser.Math.Between(20, layout.tileSize * 3 + slot.row * 18);

        this.scene.tweens.killTweensOf(parts.container);
        resetTileVisualState(parts, target.x + jitterX, startY, layout.tileSize);
        if (!reduced) {
          parts.container.setRotation(Phaser.Math.FloatBetween(-0.28, 0.28));
        }

        this.scene.tweens.add({
          targets: parts.container,
          x: target.x,
          y: target.y,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          duration: reduced ? 220 : RAIN_DURATION_MS + Phaser.Math.Between(0, 120),
          ease: reduced ? 'Quad.easeOut' : 'Bounce.easeOut',
          onComplete: () => {
            resetTileVisualState(parts, target.x, target.y, layout.tileSize);
            finishSlot();
          },
        });
      });
      this.pendingTimers.push(timer);
    });
  }

  private playLandingShine(): void {
    if (this.destroyed) return;

    const { tileSprites, layout, contrast } = this.config;
    if (contrast.isReducedMotion()) {
      this.config.onComplete();
      return;
    }

    let remaining = CONFIG.GRID_ROWS * CONFIG.GRID_COLS;
    const finishShine = () => {
      remaining--;
      if (remaining <= 0 && !this.destroyed) this.config.onComplete();
    };

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const delay = (col + row) * 28;
        const timer = this.scene.time.delayedCall(delay, () => {
          if (this.destroyed) return;

          const parts = tileSprites[row][col];
          const size = layout.tileSize;
          const shine = this.scene.add
            .rectangle(-size * 0.9, 0, size * 0.22, size * 1.75, 0xffffff, 0.85)
            .setRotation(-0.62)
            .setBlendMode(Phaser.BlendModes.ADD);
          parts.container.add(shine);
          this.shineSprites.push(shine);

          this.scene.tweens.add({
            targets: shine,
            x: size * 0.9,
            alpha: 0,
            duration: 420,
            ease: 'Sine.easeOut',
            onComplete: () => {
              shine.destroy();
              finishShine();
            },
          });
        });
        this.pendingTimers.push(timer);
      }
    }
  }
}
