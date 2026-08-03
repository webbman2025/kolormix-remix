import Phaser from 'phaser';

export class ShakeButton {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private onClick: () => void;
  private uses = 3;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onClick: () => void,
  ) {
    this.onClick = onClick;

    this.bg = scene.add
      .rectangle(x, y, 160, 48, 0x330066)
      .setStrokeStyle(2, 0xff00ff)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.label = scene.add
      .text(x, y, 'RESET ×3', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.bg.on('pointerdown', () => {
      if (this.uses > 0) this.onClick();
    });

    this.updateLabel();
  }

  setUses(uses: number): void {
    this.uses = uses;
    this.updateLabel();
    this.bg.setAlpha(uses > 0 ? 1 : 0.4);
    this.bg.disableInteractive();
    if (uses > 0) this.bg.setInteractive({ useHandCursor: true });
  }

  private updateLabel(): void {
    this.label.setText(`RESET ×${this.uses}`);
    this.bg.setData('aria-label', `Reset board. ${this.uses} uses remaining.`);
  }

  destroy(): void {
    this.bg.destroy();
    this.label.destroy();
  }
}
