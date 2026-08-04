import Phaser from 'phaser';
import type { GameLayout } from './GameLayout';

export class TimerBar {
  private scene: Phaser.Scene;
  private x = 0;
  private y = 0;
  private height = 0;
  private barWidth = 16;
  private active = true;
  private well: Phaser.GameObjects.Graphics;
  private track: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private fillH = 0;
  private progress = 1;
  private lastDrawnProgress = -1;
  private state: 'normal' | 'warning' | 'critical' = 'normal';
  private flashTimer = 0;
  private lastFlashAlpha = 1;

  constructor(scene: Phaser.Scene, layout: GameLayout) {
    this.scene = scene;
    this.well = scene.add.graphics().setDepth(18);
    this.track = scene.add.graphics().setDepth(19);
    this.fill = scene.add.graphics().setDepth(20);
    this.applyLayout(layout);
  }

  applyLayout(layout: GameLayout): void {
    this.x = layout.timerX;
    this.y = layout.gridTop;
    this.height = layout.gridHeight;
    this.barWidth = layout.timerBarWidth;
    this.drawWell();
    this.drawTrack();
    this.redrawFill();
  }

  setActive(active: boolean): void {
    this.active = active;
    this.setVisible(true);
    if (!active) {
      this.progress = 1;
      this.state = 'normal';
      this.redrawFill();
    }
  }

  private drawWell(): void {
    const pad = Math.max(3, Math.round(this.barWidth * 0.35));
    const outerW = this.barWidth + pad * 2;
    const x = this.x - pad;
    const y = this.y - pad;
    const h = this.height + pad * 2;
    const radius = outerW / 2;

    this.well.clear();
    this.well.fillStyle(0x030208, 1);
    this.well.fillRoundedRect(x, y, outerW, h, radius);
    this.well.fillStyle(0x0a0612, 0.95);
    this.well.fillRoundedRect(x + 2, y + 2, outerW - 4, h - 4, radius - 1);
    this.well.lineStyle(1, 0x2a1848, 0.6);
    this.well.strokeRoundedRect(x + 1, y + 1, outerW - 2, h - 2, radius);
  }

  private drawTrack(): void {
    const w = this.barWidth;
    const radius = w / 2;
    this.track.clear();
    this.track.fillStyle(0xffffff, 0.12);
    this.track.fillRoundedRect(this.x, this.y, w, this.height, radius);
    this.track.lineStyle(2, 0xffffff, 0.95);
    this.track.strokeRoundedRect(this.x, this.y, w, this.height, radius);
  }

  setVisible(visible: boolean): void {
    this.well.setVisible(visible);
    this.track.setVisible(visible);
    this.fill.setVisible(visible);
  }

  updateProgress(progress: number): void {
    if (!this.active) return;
    this.progress = Phaser.Math.Clamp(progress, 0, 1);
    const quantized = Math.round(this.progress * 100) / 100;
    if (quantized === this.lastDrawnProgress && this.state !== 'critical') return;
    this.lastDrawnProgress = quantized;
    const innerH = this.height - 8;
    this.fillH = Math.max(4, innerH * this.progress);
    this.redrawFill();
  }

  private redrawFill(): void {
    const w = this.barWidth - 4;
    const x = this.x + 2;
    const bottom = this.y + this.height - 4;

    this.fill.clear();
    if (!this.active) return;

    const y = bottom - this.fillH;
    let color = 0xff2222;
    if (this.state === 'warning') color = 0xffaa00;
    if (this.state === 'critical') color = 0xff1111;

    this.fill.fillStyle(color, 1);
    this.fill.fillRoundedRect(x, y, w, this.fillH, 4);
  }

  setWarning(): void {
    this.state = 'warning';
    this.lastDrawnProgress = -1;
    this.redrawFill();
  }

  setCritical(): void {
    this.state = 'critical';
    this.lastDrawnProgress = -1;
    this.redrawFill();
  }

  setNormal(): void {
    this.state = 'normal';
    this.lastDrawnProgress = -1;
    this.redrawFill();
  }

  pulse(): void {
    this.scene.tweens.add({
      targets: this.fill,
      alpha: 0.5,
      duration: 120,
      yoyo: true,
      repeat: 1,
    });
  }

  tick(delta: number, reducedMotion: boolean): void {
    if (!this.active || this.state !== 'critical' || reducedMotion) return;
    this.flashTimer += delta;
    if (this.flashTimer < 200) return;
    this.flashTimer = 0;
    const alpha = this.lastFlashAlpha > 0.75 ? 0.5 : 1;
    if (alpha === this.lastFlashAlpha) return;
    this.lastFlashAlpha = alpha;
    this.fill.alpha = alpha;
  }

  destroy(): void {
    this.well.destroy();
    this.track.destroy();
    this.fill.destroy();
  }
}

export function createTimerBar(scene: Phaser.Scene, layout: GameLayout): TimerBar {
  return new TimerBar(scene, layout);
}
