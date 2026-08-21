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
