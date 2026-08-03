import Phaser from 'phaser';
import type { GameLayout } from './GameLayout';

export class ScoreDisplay {
  private label: Phaser.GameObjects.Text;
  private value: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, layout: GameLayout) {
    this.label = scene.add
      .text(0, 0, 'SCORE:', {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '16px',
        color: '#ffcc00',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setDepth(21);

    this.value = scene.add
      .text(0, 0, '00000000', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setDepth(21);

    this.applyLayout(layout);
  }

  applyLayout(layout: GameLayout): void {
    const { width, headerY: y, uiScale: s } = layout;
    const centerX = width / 2;
    const labelSize = Math.round(16 * s);
    const valueSize = Math.round(20 * s);

    this.label
      .setPosition(centerX - Math.round(42 * s), y)
      .setFontSize(labelSize);
    this.value
      .setPosition(centerX - Math.round(36 * s), y)
      .setFontSize(valueSize);
  }

  setScore(score: number): void {
    this.value.setText(String(score).padStart(8, '0'));
  }

  showFloat(x: number, y: number, message: string, scene: Phaser.Scene, uiScale = 1): void {
    const floater = scene.add
      .text(x, y, message, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(16 * uiScale)}px`,
        color: '#ffcc00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(30);

    scene.tweens.add({
      targets: floater,
      y: y - 40 * uiScale,
      alpha: 0,
      duration: 800,
      onComplete: () => floater.destroy(),
    });
  }

  destroy(): void {
    this.label.destroy();
    this.value.destroy();
  }
}
