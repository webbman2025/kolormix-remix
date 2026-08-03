import Phaser from 'phaser';

/** Recessed socket behind a preview/counter tile. */
export function drawTileWell(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  depth = 15,
): Phaser.GameObjects.Graphics {
  const pad = Math.max(4, Math.round(size * 0.12));
  const outer = size + pad * 2;
  const g = scene.add.graphics().setDepth(depth);

  g.fillStyle(0x020106, 1);
  g.fillRoundedRect(x - outer / 2, y - outer / 2, outer, outer, Math.round(size * 0.18));

  g.fillStyle(0x120a1e, 0.95);
  g.fillRoundedRect(
    x - outer / 2 + 2,
    y - outer / 2 + 2,
    outer - 4,
    outer - 4,
    Math.round(size * 0.16),
  );

  g.lineStyle(1, 0x3a2060, 0.85);
  g.strokeRoundedRect(x - outer / 2, y - outer / 2, outer, outer, Math.round(size * 0.18));

  return g;
}

/** Inset tray behind the counter cluster (right side of preview row). */
export function drawCounterTray(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth = 14,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const radius = 8;

  g.fillStyle(0x030208, 1);
  g.fillRoundedRect(x, y, width, height, radius);

  g.fillStyle(0x08050f, 0.95);
  g.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, radius - 1);

  g.lineStyle(1, 0x2a1848, 0.7);
  g.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, radius);

  return g;
}

/** Wide recessed band for the left preview slots. */
export function drawPreviewTray(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth = 14,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const radius = 10;

  g.fillStyle(0x030208, 1);
  g.fillRoundedRect(x, y, width, height, radius);

  g.fillStyle(0x07040e, 0.92);
  g.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, radius - 1);

  g.lineStyle(1, 0x251540, 0.65);
  g.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, radius);

  return g;
}
