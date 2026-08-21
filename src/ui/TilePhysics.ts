import Phaser from 'phaser';
import type { GlossyTileParts } from './GlossyTile';

type MatterGameObject = Phaser.GameObjects.GameObject & {
  body?: MatterJS.BodyType | null;
};

/** Detach Matter.js from a tile so tweens control position/scale again. */
export function releaseMatterBody(
  scene: Phaser.Scene,
  gameObject: Phaser.GameObjects.GameObject,
): void {
  const target = gameObject as MatterGameObject;
  if (!target.body) return;

  scene.matter.world.remove(target, true);
  target.body = null;
}

export function releaseAllTilePhysics(
  scene: Phaser.Scene,
  tileSprites: GlossyTileParts[][],
): void {
  for (const row of tileSprites) {
    for (const parts of row) {
      releaseMatterBody(scene, parts.container);
    }
  }
}

/** Reset transform/visual state after physics intro or animations. */
export function resetTileVisualState(
  parts: GlossyTileParts,
  x: number,
  y: number,
  size: number,
  depth = 5,
): void {
  const container = parts.container;
  container.setVisible(true);
  container.setAlpha(1);
  container.setRotation(0);
  container.setScale(1);
  container.setDepth(depth);
  container.setPosition(x, y);
  parts.hitArea.setSize(size, size);
}
