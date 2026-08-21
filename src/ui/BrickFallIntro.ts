import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { Grid } from '../game/Grid';
import type { ContrastMode } from '../accessibility/ContrastMode';
import type { GlossyTileParts } from './GlossyTile';
import type { GameLayout } from './GameLayout';
import { releaseAllTilePhysics, resetTileVisualState } from './TilePhysics';

const INTRO_GRAVITY_Y = 1.65;
const SPAWN_STAGGER_MS = 20;
const SETTLE_AFTER_LAST_MS = 1600;
const SNAP_MS = 420;

interface BrickFallIntroConfig {
  layout: GameLayout;
  grid: Grid;
  contrast: ContrastMode;
  tileSprites: GlossyTileParts[][];
  getTilePosition: (col: number, row: number) => { x: number; y: number };
  onComplete: () => void;
}

/** Press-to-start intro: grid tiles rain in with Matter.js brick physics, then snap into place. */
export class BrickFallIntro {
  private scene: Phaser.Scene;
  private config: BrickFallIntroConfig;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private walls: MatterJS.BodyType[] = [];
  private brickObjects: Phaser.GameObjects.Container[] = [];
  private started = false;
  private destroyed = false;
  private pendingTimers: Phaser.Time.TimerEvent[] = [];

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
      if (this.config.contrast.isReducedMotion()) {
        this.playReducedMotionIntro();
      } else {
        this.playPhysicsIntro();
      }
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
    this.cleanupPhysics();
    this.scene.matter.world.pause();
  }

  private clearUi(): void {
    this.ui.forEach((object) => object.destroy());
    this.ui = [];
  }

  private playReducedMotionIntro(): void {
    const { tileSprites, getTilePosition } = this.config;
    let pending = CONFIG.GRID_ROWS * CONFIG.GRID_COLS;

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const parts = tileSprites[row][col];
        const target = getTilePosition(col, row);
        parts.container.setVisible(true);
        parts.container.setAlpha(0);
        parts.container.setPosition(target.x, target.y - 24);
        parts.container.setRotation(0);
        parts.container.setScale(1);

        this.scene.tweens.add({
          targets: parts.container,
          alpha: 1,
          y: target.y,
          duration: 220,
          delay: (row * CONFIG.GRID_COLS + col) * 18,
          ease: 'Quad.easeOut',
          onComplete: () => {
            resetTileVisualState(parts, target.x, target.y, this.config.layout.tileSize);
            pending--;
            if (pending === 0) this.config.onComplete();
          },
        });
      }
    }
  }

  private playPhysicsIntro(): void {
    const world = this.scene.matter.world;
    world.resume();
    world.setGravity(0, INTRO_GRAVITY_Y);

    this.createWalls();
    this.spawnFallingBricks();
  }

  private createWalls(): void {
    const { layout } = this.config;
    const gridWidth =
      CONFIG.GRID_COLS * layout.tileSize + (CONFIG.GRID_COLS - 1) * layout.tileGap;
    const thickness = Math.max(16, Math.round(24 * layout.uiScale));
    const wallHeight = layout.gridHeight + layout.tileSize * 3;
    const floorY = layout.gridTop + layout.gridHeight + thickness / 2;

    const left = this.scene.matter.bodies.rectangle(
      layout.gridLeft - thickness / 2,
      layout.gridTop + wallHeight / 2 - layout.tileSize,
      thickness,
      wallHeight,
      { isStatic: true, friction: 0.95, restitution: 0.05, label: 'intro-wall' },
    );

    const right = this.scene.matter.bodies.rectangle(
      layout.gridLeft + gridWidth + thickness / 2,
      layout.gridTop + wallHeight / 2 - layout.tileSize,
      thickness,
      wallHeight,
      { isStatic: true, friction: 0.95, restitution: 0.05, label: 'intro-wall' },
    );

    const floor = this.scene.matter.bodies.rectangle(
      layout.gridLeft + gridWidth / 2,
      floorY,
      gridWidth + thickness * 2,
      thickness,
      { isStatic: true, friction: 0.95, restitution: 0.08, label: 'intro-floor' },
    );

    this.walls.push(left, right, floor);
    this.scene.matter.world.add(this.walls);
  }

  private spawnFallingBricks(): void {
    const { tileSprites, getTilePosition, layout } = this.config;
    let spawnIndex = 0;
    let lastDelay = 0;

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const delay = spawnIndex * SPAWN_STAGGER_MS;
        lastDelay = delay;
        spawnIndex++;

        const timer = this.scene.time.delayedCall(delay, () => {
          if (this.destroyed) return;

          const parts = tileSprites[row][col];
          const target = getTilePosition(col, row);
          const jitterX = Phaser.Math.Between(
            Math.round(-layout.tileSize * 0.35),
            Math.round(layout.tileSize * 0.35),
          );
          const spawnY =
            -layout.tileSize -
            row * (layout.tileSize * 0.55) -
            Phaser.Math.Between(40, layout.tileSize * 4);

          parts.container.setVisible(true);
          parts.container.setPosition(target.x + jitterX, spawnY);
          parts.container.setRotation(Phaser.Math.FloatBetween(-0.35, 0.35));
          parts.container.setScale(1);

          this.scene.matter.add.gameObject(parts.container, {
            shape: {
              type: 'rectangle',
              width: layout.tileSize * 0.92,
              height: layout.tileSize * 0.92,
              chamfer: { radius: 6 },
            },
            restitution: 0.12,
            friction: 0.85,
            frictionAir: 0.014,
            density: 0.0018,
            label: 'intro-brick',
          });

          const body = parts.container.body as MatterJS.BodyType | null;
          if (body) {
            this.brickObjects.push(parts.container);
            this.scene.matter.body.setAngularVelocity(
              body,
              Phaser.Math.FloatBetween(-0.22, 0.22),
            );
            this.scene.matter.body.setVelocity(body, {
              x: Phaser.Math.FloatBetween(-1.8, 1.8),
              y: Phaser.Math.FloatBetween(1, 4),
            });
          }
        });
        this.pendingTimers.push(timer);
      }
    }

    const settleTimer = this.scene.time.delayedCall(
      lastDelay + SETTLE_AFTER_LAST_MS,
      () => this.snapBricksIntoGrid(),
    );
    this.pendingTimers.push(settleTimer);
  }

  private snapBricksIntoGrid(): void {
    if (this.destroyed) return;

    const { tileSprites, getTilePosition, layout } = this.config;
    this.cleanupPhysics();

    let pending = CONFIG.GRID_ROWS * CONFIG.GRID_COLS;
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const parts = tileSprites[row][col];
        const target = getTilePosition(col, row);
        this.scene.tweens.killTweensOf(parts.container);
        resetTileVisualState(parts, parts.container.x, parts.container.y, layout.tileSize);

        this.scene.tweens.add({
          targets: parts.container,
          x: target.x,
          y: target.y,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          duration: SNAP_MS,
          delay: (row + col) * 12,
          ease: 'Back.easeOut',
          onComplete: () => {
            resetTileVisualState(parts, target.x, target.y, layout.tileSize);
            pending--;
            if (pending === 0) this.config.onComplete();
          },
        });
      }
    }
  }

  private cleanupPhysics(): void {
    for (const wall of this.walls) {
      this.scene.matter.world.remove(wall);
    }
    this.walls = [];

    releaseAllTilePhysics(this.scene, this.config.tileSprites);
    this.brickObjects = [];

    this.scene.matter.world.setGravity(0, 0);
    this.scene.matter.world.pause();
  }
}
