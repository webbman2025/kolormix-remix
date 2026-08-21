import type { GlossyTileParts } from './GlossyTile';

/** Hard-reset a tile container to its grid slot (position, rotation, scale, visibility). */
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
