import Phaser from 'phaser';
import { COLOR_GOALS, type MainSecondaryGoal } from '../config';
import { SecondaryGoalQueue } from '../game/SecondaryGoalQueue';
import { paintPreviewTile } from './GlossyTile';
import type { GameLayout } from './GameLayout';
import { drawCounterTray, drawPreviewTray, drawTileWell } from './PreviewWells';
import type { TileColor } from '../types';

/** Depths — preview tiles must sit above the chrome panel (depth 12). */
const DEPTH = {
  TRAY: 14,
  WELL: 17,
  TILE: 22,
  LABEL: 26,
} as const;

const GOAL_TILE_COLORS: Record<MainSecondaryGoal, TileColor> = {
  green: 'green',
  purple: 'purple',
  orange: 'orange',
};

const COUNTER_KEYS: MainSecondaryGoal[] = ['green', 'purple', 'orange'];

export class PreviewRow {
  private scene: Phaser.Scene;
  private layout: GameLayout;
  private goalQueue = new SecondaryGoalQueue();
  private trayChrome: Phaser.GameObjects.GameObject[] = [];
  private previewWells: Phaser.GameObjects.Graphics[] = [];
  private counterWells: Phaser.GameObjects.Graphics[] = [];
  private previewContainers: Phaser.GameObjects.Container[] = [];
  private counterTiles: Phaser.GameObjects.Container[] = [];
  private counterTexts: Partial<Record<MainSecondaryGoal, Phaser.GameObjects.Text>> = {};
  private currentGoalContainer: Phaser.GameObjects.Container | null = null;
  private currentGoalPulse: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, layout: GameLayout) {
    this.scene = scene;
    this.layout = layout;

    COUNTER_KEYS.forEach((key) => {
      this.counterTexts[key] = scene.add
        .text(0, 0, String(COLOR_GOALS[key]), {
          fontFamily: 'Arial Black, Impact, sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.LABEL);
    });

    this.rebuild();
  }

  applyLayout(layout: GameLayout): void {
    this.layout = layout;
    this.rebuild();
  }

  getCurrentGoal(): TileColor | null {
    return this.goalQueue.currentGoal();
  }

  isAllComplete(): boolean {
    return this.goalQueue.isComplete();
  }

  onMergeResult(result: TileColor): boolean {
    const completed = this.goalQueue.tryComplete(result);
    if (completed) this.rebuildSlots();
    return completed;
  }

  onClear(color: TileColor, tileCount: number): void {
    this.goalQueue.recordClear(color, tileCount);
    this.refreshCounters();
  }

  reset(): void {
    this.goalQueue.reset();
    this.rebuild();
  }

  private rebuild(): void {
    this.clearAll();
    this.buildTrayChrome();
    this.rebuildSlots();
    this.layoutCounters();
    this.refreshCounters();
  }

  private clearAll(): void {
    this.trayChrome.forEach((o) => o.destroy());
    this.trayChrome = [];
    this.clearPreviewSlots();
    this.clearCounters();
  }

  private clearPreviewSlots(): void {
    this.stopCurrentGoalPulse();
    this.previewWells.forEach((w) => w.destroy());
    this.previewWells = [];
    this.previewContainers.forEach((c) => {
      c.destroy();
    });
    this.previewContainers = [];
    this.currentGoalContainer = null;
  }

  private clearCounters(): void {
    this.counterWells.forEach((w) => w.destroy());
    this.counterWells = [];
    this.counterTiles.forEach((c) => c.destroy());
    this.counterTiles = [];
  }

  private getMetrics(): {
    margin: number;
    bandTop: number;
    bandH: number;
    bandCenter: number;
    counterSize: number;
    counterGap: number;
    counterPad: number;
    clusterW: number;
    clusterH: number;
    clusterX: number;
    clusterY: number;
    previewTrayW: number;
  } {
    const { width, headerHeight, previewPanelHeight, uiScale: s } = this.layout;
    const margin = Math.round(8 * s);
    const bandTop = headerHeight + Math.round(3 * s);
    const bandH = previewPanelHeight - Math.round(6 * s);
    const bandCenter = bandTop + bandH / 2;
    const counterSize = Math.round(30 * s);
    const counterGap = Math.round(4 * s);
    const counterPad = Math.round(5 * s);
    const clusterW = counterSize * 3 + counterGap * 2 + counterPad * 2;
    const clusterH = counterSize + counterPad * 2;
    const clusterX = width - margin - clusterW;
    const clusterY = bandTop + (bandH - clusterH) / 2;
    const previewTrayW = clusterX - margin;

    return {
      margin,
      bandTop,
      bandH,
      bandCenter,
      counterSize,
      counterGap,
      counterPad,
      clusterW,
      clusterH,
      clusterX,
      clusterY,
      previewTrayW,
    };
  }

  private buildTrayChrome(): void {
    const m = this.getMetrics();

    this.trayChrome.push(
      drawPreviewTray(this.scene, m.margin, m.bandTop, m.previewTrayW, m.bandH, DEPTH.TRAY),
      drawCounterTray(
        this.scene,
        m.clusterX,
        m.clusterY,
        m.clusterW,
        m.clusterH,
        DEPTH.TRAY,
      ),
    );
  }

  private rebuildSlots(): void {
    this.clearPreviewSlots();
    const { uiScale: s } = this.layout;
    const m = this.getMetrics();
    const goals = this.goalQueue.peek(3);

    const smallSize = Math.round(44 * s);
    const largeSize = Math.round(54 * s);
    const step = Math.round(58 * s);
    const leftPad = Math.round(20 * s);

    const displayGoals: (TileColor | null)[] = [
      goals[2] ?? null,
      goals[1] ?? null,
      goals[0] ?? null,
    ];
    const sizes = [smallSize, smallSize, largeSize];
    const xs = [
      leftPad + smallSize / 2,
      leftPad + step + smallSize / 2,
      leftPad + step * 2 + largeSize / 2,
    ];

    displayGoals.forEach((color, i) => {
      if (!color) return;
      const size = sizes[i];
      const x = xs[i];
      this.previewWells.push(
        drawTileWell(this.scene, x, m.bandCenter, size, DEPTH.WELL),
      );
      const container = paintPreviewTile(
        this.scene,
        x,
        m.bandCenter,
        size,
        color,
        i === 2,
        DEPTH.TILE,
      );
      this.previewContainers.push(container);
      if (i === 2) {
        this.currentGoalContainer = container;
      }
    });

    if (this.currentGoalContainer) {
      this.startCurrentGoalPulse(this.currentGoalContainer);
    }
  }

  private stopCurrentGoalPulse(): void {
    if (this.currentGoalPulse) {
      this.currentGoalPulse.stop();
      this.currentGoalPulse = null;
    }
    if (this.currentGoalContainer) {
      this.scene.tweens.killTweensOf(this.currentGoalContainer);
      this.currentGoalContainer.setScale(1);
    }
  }

  private startCurrentGoalPulse(container: Phaser.GameObjects.Container): void {
    this.stopCurrentGoalPulse();
    this.currentGoalContainer = container;
    container.setScale(1);

    this.currentGoalPulse = this.scene.tweens.add({
      targets: container,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private layoutCounters(): void {
    this.clearCounters();
    const { uiScale: s } = this.layout;
    const m = this.getMetrics();

    const topY = m.clusterY + m.counterPad + m.counterSize / 2;
    const startX = m.clusterX + m.counterPad + m.counterSize / 2;
    const labelSize = Math.max(10, Math.round(12 * s));

    COUNTER_KEYS.forEach((key, i) => {
      const cx = startX + i * (m.counterSize + m.counterGap);
      this.counterWells.push(
        drawTileWell(this.scene, cx, topY, m.counterSize, DEPTH.WELL),
      );
      this.counterTiles.push(
        paintPreviewTile(
          this.scene,
          cx,
          topY,
          m.counterSize,
          GOAL_TILE_COLORS[key],
          false,
          DEPTH.TILE,
        ),
      );
      this.counterTexts[key]
        ?.setPosition(cx, topY)
        .setFontSize(labelSize);
    });
  }

  private refreshCounters(): void {
    COUNTER_KEYS.forEach((key) => {
      const remaining = this.goalQueue.getRemaining(key);
      this.counterTexts[key]?.setText(String(remaining));
    });
  }
}
