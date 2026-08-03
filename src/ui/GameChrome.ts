import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { GameLayout } from './GameLayout';

export function drawGameChrome(
  scene: Phaser.Scene,
  layout: GameLayout,
): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { width, headerHeight, previewPanelHeight, gridTop, gridHeight } = layout;
  const gridWidth =
    CONFIG.GRID_COLS * layout.tileSize + (CONFIG.GRID_COLS - 1) * layout.tileGap;

  const headerBar = scene.add
    .rectangle(width / 2, headerHeight / 2, width, headerHeight, 0x06030c, 0.98)
    .setDepth(12);
  objects.push(headerBar);

  const headerLine = scene.add.graphics().setDepth(13);
  headerLine.lineStyle(1, 0x4422aa, 0.45);
  headerLine.lineBetween(0, headerHeight, width, headerHeight);
  objects.push(headerLine);

  const previewTop = headerHeight;
  const previewPanel = scene.add
    .rectangle(
      width / 2,
      previewTop + previewPanelHeight / 2,
      width,
      previewPanelHeight,
      0x08050f,
      0.88,
    )
    .setDepth(11);
  objects.push(previewPanel);

  const previewLine = scene.add.graphics().setDepth(13);
  previewLine.lineStyle(1, 0x5533bb, 0.35);
  previewLine.lineBetween(0, gridTop, width, gridTop);
  objects.push(previewLine);

  const bodyHeight = layout.height - gridTop;
  const bodyPanel = scene.add
    .rectangle(width / 2, gridTop + bodyHeight / 2, width, bodyHeight, 0x0a0614, 1)
    .setDepth(2);
  objects.push(bodyPanel);

  const gridGlow = scene.add.graphics().setDepth(3);
  gridGlow.lineStyle(1, 0x6622cc, 0.15);
  gridGlow.strokeRoundedRect(
    layout.gridLeft - 4,
    layout.gridTop - 4,
    gridWidth + 8,
    gridHeight + 8,
    8,
  );
  objects.push(gridGlow);

  return objects;
}
