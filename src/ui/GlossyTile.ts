import Phaser from 'phaser';
import { TILE_COLORS, HIGH_CONTRAST_COLORS, isSecondary } from '../game/ColorMixer';
import type { TileColor } from '../types';

export interface TileVisualState {
  selected: boolean;
  validTarget: boolean;
  clearable: boolean;
  wildcardBonus: boolean;
  wildcardReward: boolean;
  highContrast: boolean;
}

export interface GlossyTileParts {
  container: Phaser.GameObjects.Container;
  hitArea: Phaser.GameObjects.Rectangle;
}

export function createGlossyTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  depth = 5,
): GlossyTileParts {
  const container = scene.add.container(x, y).setDepth(depth);
  const hitArea = scene.add
    .rectangle(0, 0, size, size, 0x000000, 0.001)
    .setInteractive({ useHandCursor: true });
  container.add(hitArea);
  return { container, hitArea };
}

export function paintGlossyTile(
  scene: Phaser.Scene,
  parts: GlossyTileParts,
  size: number,
  color: TileColor | null,
  state: TileVisualState,
): void {
  const { container, hitArea } = parts;
  const children = [...container.list];
  for (const child of children) {
    if (child !== hitArea) child.destroy();
  }

  const pad = 2;
  const inner = size - pad * 2;
  const radius = 6;

  if (!color) {
    const g = scene.add.graphics();
    g.fillStyle(0x12101f, 0.6);
    g.fillRoundedRect(-inner / 2, -inner / 2, inner, inner, radius);
    container.addAt(g, 0);
    return;
  }

  const palette = state.highContrast ? HIGH_CONTRAST_COLORS[color] : TILE_COLORS[color];
  const fill = palette.fill;
  const border = 'border' in palette ? palette.border : 0x333355;

  const frame = scene.add.graphics();
  frame.fillStyle(0x0d0b18, 1);
  frame.fillRoundedRect(-size / 2, -size / 2, size, size, radius + 2);
  frame.fillStyle(0x252338, 1);
  frame.fillRoundedRect(-inner / 2 - 2, -inner / 2 - 2, inner + 4, inner + 4, radius);
  container.addAt(frame, 0);

  const body = scene.add.graphics();
  body.fillStyle(fill, 1);
  body.fillRoundedRect(-inner / 2, -inner / 2, inner, inner, radius);

  container.addAt(body, 1);

  const shine = scene.add.graphics();
  shine.fillStyle(0xffffff, 0.45);
  shine.fillEllipse(0, -inner / 4, inner * 0.7, inner * 0.28);
  container.addAt(shine, 2);

  let strokeColor = border;
  let strokeW = 2;
  if (state.validTarget) {
    strokeColor = 0x44ff88;
    strokeW = 3;
  }
  if (state.selected) {
    strokeColor = 0xffffff;
    strokeW = 4;
  }
  if (state.clearable) {
    strokeColor = 0xff44ff;
    strokeW = 4;
  }
  if (state.wildcardReward) {
    strokeColor = 0xffff66;
    strokeW = 5;
  }
  if (state.wildcardBonus) {
    strokeColor = 0xffdd44;
    strokeW = 4;
  }

  const outline = scene.add.graphics();
  outline.lineStyle(strokeW, strokeColor, 1);
  outline.strokeRoundedRect(-inner / 2, -inner / 2, inner, inner, radius);
  container.addAt(outline, 3);

  if (state.wildcardReward && color && isSecondary(color)) {
    const star = scene.add
      .text(0, 0, '★', {
        fontSize: `${Math.max(16, Math.round(size * 0.38))}px`,
        color: '#ffffaa',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    container.add(star);
  }

  if (state.wildcardBonus && color && color !== 'wildcard') {
    const star = scene.add
      .text(0, 0, '★', {
        fontSize: `${Math.max(14, Math.round(size * 0.42))}px`,
        color: '#ffee00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    container.add(star);
  }

  if (color === 'wildcard') {
    const star = scene.add
      .text(0, 0, '★', {
        fontSize: `${Math.max(12, Math.round(size * 0.4))}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(star);
  }
}

export function paintPreviewTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  color: TileColor,
  highlighted: boolean,
  depth = 22,
): Phaser.GameObjects.Container {
  const parts = createGlossyTile(scene, x, y, size, depth);
  paintGlossyTile(scene, parts, size, color, {
    selected: highlighted,
    validTarget: false,
    clearable: false,
    wildcardBonus: false,
    wildcardReward: false,
    highContrast: false,
  });
  parts.hitArea.disableInteractive();
  return parts.container;
}
