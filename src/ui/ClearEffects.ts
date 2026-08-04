import Phaser from 'phaser';
import { TILE_COLORS } from '../game/ColorMixer';
import type { TileColor } from '../types';

/** Burst particles when a tile explodes on clear. */
export function spawnExplodeBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: TileColor | null,
  uiScale: number,
): void {
  const fill = color ? TILE_COLORS[color].fill : 0xffffff;
  const count = uiScale < 1 ? 6 : 10;
  const spread = 32 * uiScale;
  const size = Math.max(3, Math.round(4 * uiScale));

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
    const dist = Phaser.Math.FloatBetween(spread * 0.5, spread);
    const shard = scene.add.circle(x, y, size, fill).setDepth(28);

    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0.2,
      duration: Phaser.Math.Between(220, 320),
      ease: 'Power2',
      onComplete: () => shard.destroy(),
    });
  }
}

/** Scale-up + fade-out on a cleared tile container. */
export function tweenTileExplode(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  onComplete: () => void,
): void {
  scene.tweens.killTweensOf(container);
  scene.tweens.add({
    targets: container,
    scaleX: 1.35,
    scaleY: 1.35,
    alpha: 0,
    duration: 220,
    ease: 'Power2',
    onComplete,
  });
}

/** Expanding gold rings for wildcard reward moments. */
export function spawnWildcardRingWave(
  scene: Phaser.Scene,
  x: number,
  y: number,
  uiScale: number,
): void {
  for (let i = 0; i < 3; i++) {
    const ring = scene.add
      .circle(x, y, 12 * uiScale, 0x000000, 0)
      .setStrokeStyle(Math.max(2, Math.round(4 * uiScale)), 0xffee44, 0.95)
      .setDepth(40);

    scene.tweens.add({
      targets: ring,
      scaleX: 4 + i * 0.8,
      scaleY: 4 + i * 0.8,
      alpha: 0,
      delay: i * 90,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}

/** Large particle shower for wildcard reward collect. */
export function spawnMegaRewardBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: TileColor | null,
  uiScale: number,
): void {
  const fill = color ? TILE_COLORS[color].fill : 0xffffff;
  const count = Math.round(16 * uiScale);
  const spread = 56 * uiScale;
  const size = Math.max(4, Math.round(6 * uiScale));

  for (let i = 0; i < count; i++) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.FloatBetween(spread * 0.4, spread);
    const shard = scene.add.circle(x, y, size, fill).setDepth(42);

    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: Phaser.Math.FloatBetween(0.1, 0.4),
      duration: Phaser.Math.Between(320, 520),
      ease: 'Power3',
      onComplete: () => shard.destroy(),
    });
  }
}

export function flashWildcardReward(scene: Phaser.Scene): void {
  scene.cameras.main.flash(220, 255, 245, 120, true);
}
