import Phaser from 'phaser';
import { CONFIG } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const isMobile =
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0A0014',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  fps: {
    target: isMobile ? 30 : 60,
    smoothStep: true,
  },
  render: {
    antialias: false,
    roundPixels: true,
    powerPreference: 'low-power',
  },
  scene: [BootScene, MenuScene, GameScene],
  input: {
    activePointers: 2,
  },
};

const game = new Phaser.Game(config);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.loop.sleep();
  } else {
    game.loop.wake();
  }
});
