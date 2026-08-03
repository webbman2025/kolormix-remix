import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const progress = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Loading Kolormix...',
      { fontFamily: 'monospace', fontSize: '18px', color: '#ff00ff' },
    );
    progress.setOrigin(0.5);
  }

  create(): void {
    this.cameras.main.fadeIn(400);
    this.time.delayedCall(600, () => {
      this.scene.start('MenuScene');
    });
  }
}
