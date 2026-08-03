import Phaser from 'phaser';
import type { GameLayout } from './GameLayout';

export class GameHeader {
  private pauseBtn: Phaser.GameObjects.Rectangle;
  private pauseBars: Phaser.GameObjects.Rectangle[] = [];
  private scorePill: Phaser.GameObjects.Rectangle;
  private shakeBtn: Phaser.GameObjects.Rectangle;
  private shakeIcon: Phaser.GameObjects.Text;
  private shakeLabel: Phaser.GameObjects.Text;
  private onPause: () => void;
  private onShake: () => void;

  constructor(
    scene: Phaser.Scene,
    layout: GameLayout,
    onPause: () => void,
    onShake: () => void,
  ) {
    this.onPause = onPause;
    this.onShake = onShake;

    const s = layout.uiScale;
    const btn = Math.round(44 * s);

    this.pauseBtn = scene.add
      .rectangle(0, 0, btn, btn, 0x2266cc)
      .setStrokeStyle(2, 0x4488ff)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    const barW = Math.round(10 * s);
    const barH = Math.round(22 * s);
    this.pauseBars = [
      scene.add.rectangle(0, 0, barW, barH, 0xffffff).setDepth(21),
      scene.add.rectangle(0, 0, barW, barH, 0xffffff).setDepth(21),
    ];

    this.scorePill = scene.add
      .rectangle(0, 0, Math.round(210 * s), Math.round(40 * s), 0x000000, 0.85)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(20);

    this.shakeBtn = scene.add
      .rectangle(0, 0, btn, btn, 0x1a1030, 0.8)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.shakeIcon = scene.add
      .text(0, 0, '↔', { fontSize: `${Math.round(14 * s)}px`, color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(21);

    this.shakeLabel = scene.add
      .text(0, 0, '3', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(18 * s)}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.pauseBtn.on('pointerdown', () => this.onPause());
    this.shakeBtn.on('pointerdown', () => this.onShake());

    this.applyLayout(layout);
  }

  applyLayout(layout: GameLayout): void {
    const { width, headerY: y, uiScale: s } = layout;
    const edge = Math.round(12 * s);
    const btn = Math.round(44 * s);
    const gap = Math.round(8 * s);
    const pillW = Math.max(Math.round(180 * s), width - edge * 2 - btn * 2 - gap * 2);

    this.pauseBtn.setPosition(edge + btn / 2, y).setSize(btn, btn);

    const barW = Math.round(10 * s);
    const barH = Math.round(22 * s);
    this.pauseBars[0].setPosition(edge + btn / 2 - Math.round(6 * s), y).setSize(barW, barH);
    this.pauseBars[1].setPosition(edge + btn / 2 + Math.round(6 * s), y).setSize(barW, barH);

    this.scorePill
      .setPosition(width / 2, y)
      .setSize(pillW, Math.round(40 * s));

    this.shakeBtn.setPosition(width - edge - btn / 2, y).setSize(btn, btn);
    this.shakeIcon.setPosition(width - edge - btn / 2, y - Math.round(6 * s));
    this.shakeIcon.setFontSize(Math.round(14 * s));
    this.shakeLabel.setPosition(width - edge - btn / 2, y + Math.round(4 * s));
    this.shakeLabel.setFontSize(Math.round(18 * s));
  }

  setShakeUses(uses: number): void {
    this.shakeLabel.setText(String(uses));
    this.shakeBtn.setAlpha(uses > 0 ? 1 : 0.4);
    this.shakeBtn.disableInteractive();
    if (uses > 0) this.shakeBtn.setInteractive({ useHandCursor: true });
  }
}
