import Phaser from 'phaser';
import type { GameMode } from '../config';
import { ContrastMode } from '../accessibility/ContrastMode';
import { loadLeaderboard } from '../storage/Storage';

export class MenuScene extends Phaser.Scene {
  private contrast = new ContrastMode();
  private showingSettings = false;
  private showingLeaderboard = false;
  private showingAccessibility = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0014);

    this.add
      .text(width / 2, height * 0.18, 'KOLORMIX', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#ffffff',
        stroke: '#ff00ff',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.26, 'Mix neon colors. Beat the clock.', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#bf5af2',
      })
      .setOrigin(0.5);

    this.createModeButton(width / 2, height * 0.38, 'CLASSIC', 'classic');
    this.createModeButton(width / 2, height * 0.48, 'TIMED CHALLENGE', 'timed');
    this.createModeButton(width / 2, height * 0.58, 'TIME TRIAL', 'trial');

    this.createNavButton(width * 0.25, height * 0.75, 'SETTINGS', () => this.toggleSettings());
    this.createNavButton(width * 0.5, height * 0.75, 'A11Y', () => this.toggleAccessibility());
    this.createNavButton(width * 0.75, height * 0.75, 'SCORES', () => this.toggleLeaderboard());
  }

  private createModeButton(x: number, y: number, label: string, mode: GameMode): void {
    const bg = this.add
      .rectangle(x, y, 280, 52, 0x1a0a2e)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    bg.on('pointerdown', () => {
      this.scene.start('GameScene', { mode });
    });
  }

  private createNavButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add
      .rectangle(x, y, 100, 40, 0x330066)
      .setStrokeStyle(1, 0xff00ff)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5);

    bg.on('pointerdown', onClick);
  }

  private clearOverlays(): void {
    this.children.each((child) => {
      if (child.getData('overlay')) child.destroy();
    });
    this.showingSettings = false;
    this.showingLeaderboard = false;
    this.showingAccessibility = false;
  }

  private toggleSettings(): void {
    if (this.showingSettings) {
      this.clearOverlays();
      return;
    }
    this.clearOverlays();
    this.showingSettings = true;
    this.showOverlay('SETTINGS', [
      'Music & SFX volume',
      'Shake sensitivity: Medium',
      'Haptic feedback: On',
      '[Tap A11Y for accessibility]',
    ]);
  }

  private toggleAccessibility(): void {
    if (this.showingAccessibility) {
      this.clearOverlays();
      return;
    }
    this.clearOverlays();
    this.showingAccessibility = true;
    const prefs = this.contrast.prefs;
    this.showOverlay('ACCESSIBILITY', [
      `High contrast: ${prefs.highContrast ? 'ON' : 'OFF'} (tap to toggle)`,
      `Shape overlays: ${prefs.shapeOverlays ? 'ON' : 'OFF'}`,
      `Tap-only mode: ${prefs.tapOnlyMode ? 'ON' : 'OFF'}`,
      `Reduced motion: ${prefs.reducedMotion ? 'ON' : 'OFF'}`,
      `Shake enabled: ${prefs.shakeEnabled ? 'ON' : 'OFF'}`,
    ], true);
  }

  private toggleLeaderboard(): void {
    if (this.showingLeaderboard) {
      this.clearOverlays();
      return;
    }
    this.clearOverlays();
    this.showingLeaderboard = true;
    const entries = loadLeaderboard();
    const lines =
      entries.length === 0
        ? ['No scores yet. Play your first round!']
        : entries.slice(0, 5).map((e, i) => `${i + 1}. ${e.mode}: ${e.score}`);
    this.showOverlay('LEADERBOARD', lines);
  }

  private showOverlay(title: string, lines: string[], interactive = false): void {
    const { width, height } = this.scale;
    const panel = this.add
      .rectangle(width / 2, height / 2, width * 0.85, height * 0.5, 0x1a0a2e, 0.95)
      .setStrokeStyle(2, 0xff00ff)
      .setDepth(100)
      .setData('overlay', true);

    this.add
      .text(width / 2, height / 2 - 100, title, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ff00ff',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setData('overlay', true);

    lines.forEach((line, i) => {
      const t = this.add
        .text(width / 2, height / 2 - 40 + i * 28, line, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: width * 0.75 },
        })
        .setOrigin(0.5)
        .setDepth(101)
        .setData('overlay', true);

      if (interactive) {
        t.setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => this.handleA11yToggle(i));
      }
    });

    const close = this.add
      .text(width / 2, height / 2 + 100, '[ CLOSE ]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#00ffff',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .setData('overlay', true);

    close.on('pointerdown', () => this.clearOverlays());
    panel.setInteractive();
  }

  private handleA11yToggle(index: number): void {
    const keys = [
      'highContrast',
      'shapeOverlays',
      'tapOnlyMode',
      'reducedMotion',
      'shakeEnabled',
    ] as const;
    const key = keys[index];
    if (!key) return;
    const current = this.contrast.prefs[key];
    if (typeof current === 'boolean') {
      this.contrast.update({ [key]: !current });
      this.clearOverlays();
      this.toggleAccessibility();
    }
  }
}
