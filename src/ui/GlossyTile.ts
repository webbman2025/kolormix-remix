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
  faceCenterY: number;
}

type Point = { x: number; y: number };

interface GemPalette {
  abyss: string;
  deep: string;
  shadow: string;
  body: string;
  mid: string;
  bright: string;
  flare: string;
  ice: string;
  glowHex: number;
  borderHex: number;
}

const GEM_TEX = 256;

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function shadeColor(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return (clampByte(r * factor) << 16) | (clampByte(g * factor) << 8) | clampByte(b * factor);
}

function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const u = Math.max(0, Math.min(1, t));
  return (
    (clampByte(ar + (br - ar) * u) << 16) |
    (clampByte(ag + (bg - ag) * u) << 8) |
    clampByte(ab + (bb - ab) * u)
  );
}

function saturateColor(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return (
    (clampByte(gray + (r - gray) * amount) << 16) |
    (clampByte(gray + (g - gray) * amount) << 8) |
    clampByte(gray + (b - gray) * amount)
  );
}

function css(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildPalette(fill: number, glow: number, border: number): GemPalette {
  const body = saturateColor(fill, 1.65);
  const bright = saturateColor(glow, 1.55);
  return {
    abyss: css(mixColor(shadeColor(body, 0.06), 0x000000, 0.62)),
    deep: css(mixColor(shadeColor(body, 0.16), 0x000000, 0.32)),
    shadow: css(shadeColor(body, 0.4)),
    body: css(body),
    mid: css(mixColor(body, bright, 0.32)),
    bright: css(bright),
    flare: css(mixColor(bright, 0xffffff, 0.5)),
    ice: css(mixColor(bright, 0xffffff, 0.82)),
    glowHex: bright,
    borderHex: saturateColor(border, 1.25),
  };
}

function octagon(cx: number, cy: number, half: number, cut: number): Point[] {
  return [
    { x: cx - half + cut, y: cy - half },
    { x: cx + half - cut, y: cy - half },
    { x: cx + half, y: cy - half + cut },
    { x: cx + half, y: cy + half - cut },
    { x: cx + half - cut, y: cy + half },
    { x: cx - half + cut, y: cy + half },
    { x: cx - half, y: cy + half - cut },
    { x: cx - half, y: cy - half + cut },
  ];
}

function square(cx: number, cy: number, half: number): Point[] {
  return [
    { x: cx - half, y: cy - half },
    { x: cx + half, y: cy - half },
    { x: cx + half, y: cy + half },
    { x: cx - half, y: cy + half },
  ];
}

function pathPoly(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

function fillClipGradient(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: Array<[number, string]>,
): void {
  ctx.save();
  pathPoly(ctx, points);
  ctx.clip();
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [t, color] of stops) g.addColorStop(t, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GEM_TEX, GEM_TEX);
  ctx.restore();
}

function strokePoly(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number,
): void {
  pathPoly(ctx, points);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function strokeEdge(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  color: string,
  width: number,
): void {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function gemTextureKey(color: TileColor, highContrast: boolean): string {
  return `gem-square-v5-${color}-${highContrast ? 'hc' : 'lit'}`;
}

function facet(ctx: CanvasRenderingContext2D, points: Point[], x0: number, y0: number, x1: number, y1: number, a: string, b: string): void {
  fillClipGradient(ctx, points, x0, y0, x1, y1, [
    [0, a],
    [1, b],
  ]);
}

function drawRealisticGem(ctx: CanvasRenderingContext2D, palette: GemPalette): void {
  const cx = GEM_TEX / 2;
  const cy = GEM_TEX / 2 - 4;
  const s = GEM_TEX * 0.4;
  const cut = s * 0.12;
  const table = s * 0.56;

  const outer = octagon(cx, cy, s, cut);
  const tablePts = square(cx, cy, table);
  const [tl, tr, br, bl] = tablePts;

  ctx.clearRect(0, 0, GEM_TEX, GEM_TEX);
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 3;

  const under = ctx.createRadialGradient(cx, cy + s * 0.55, 4, cx, cy + s * 0.55, s * 0.85);
  under.addColorStop(0, css(palette.glowHex, 0.16));
  under.addColorStop(0.55, css(0x000000, 0.32));
  under.addColorStop(1, css(0x000000, 0));
  ctx.fillStyle = under;
  ctx.fillRect(0, 0, GEM_TEX, GEM_TEX);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  pathPoly(ctx, outer);
  ctx.fillStyle = palette.abyss;
  ctx.fill();
  ctx.restore();

  facet(ctx, outer, cx - s, cy - s, cx + s, cy + s, palette.deep, palette.abyss);

  facet(ctx, [outer[0], outer[1], tr, tl], cx, cy - s, cx, cy, palette.flare, palette.mid);
  facet(ctx, [outer[2], outer[3], br, tr], cx + s, cy, cx, cy, palette.shadow, palette.body);
  facet(ctx, [outer[4], outer[5], bl, br], cx, cy, cx, cy + s, palette.body, palette.deep);
  facet(ctx, [outer[6], outer[7], tl, bl], cx - s, cy, cx, cy, palette.bright, palette.shadow);

  facet(ctx, [outer[7], outer[0], tl], cx - s, cy - s, cx, cy, palette.ice, palette.bright);
  facet(ctx, [outer[1], outer[2], tr], cx + s, cy - s, cx, cy, palette.mid, palette.shadow);
  facet(ctx, [outer[3], outer[4], br], cx + s, cy + s, cx, cy, palette.abyss, palette.deep);
  facet(ctx, [outer[5], outer[6], bl], cx - s, cy + s, cx, cy, palette.shadow, palette.deep);

  facet(ctx, tablePts, tl.x, cy, br.x, br.y, palette.bright, palette.body);

  ctx.save();
  pathPoly(ctx, tablePts);
  ctx.clip();

  const glassCoat = ctx.createLinearGradient(cx, tl.y, cx, br.y);
  glassCoat.addColorStop(0, css(0xffffff, 0.55));
  glassCoat.addColorStop(0.18, css(0xffffff, 0.28));
  glassCoat.addColorStop(0.42, css(0xffffff, 0.06));
  glassCoat.addColorStop(1, css(0xffffff, 0));
  ctx.fillStyle = glassCoat;
  ctx.fillRect(tl.x, tl.y, table * 2, table * 2);

  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = css(0xc8eeff, 0.22);
  ctx.fillRect(tl.x, tl.y, table * 2, table * 0.38);

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = css(0xffffff, 0.2);
  ctx.fillRect(tl.x, tl.y + table * 0.14, table * 2, table * 0.08);
  ctx.fillStyle = css(0xffffff, 0.12);
  ctx.fillRect(tl.x, tl.y + table * 0.28, table * 2, 3);

  ctx.restore();

  strokePoly(ctx, [outer[0], outer[1], tr, tl], css(0x000000, 0.18), 1);
  strokePoly(ctx, [outer[2], outer[3], br, tr], css(0x000000, 0.18), 1);
  strokePoly(ctx, [outer[4], outer[5], bl, br], css(0x000000, 0.18), 1);
  strokePoly(ctx, [outer[6], outer[7], tl, bl], css(0x000000, 0.18), 1);

  strokePoly(ctx, tablePts, css(0x000000, 0.22), 1.6);
  strokeEdge(ctx, tl, tr, css(0xffffff, 0.55), 1.8);
  strokeEdge(ctx, tr, br, css(0x000000, 0.28), 1.4);
  strokeEdge(ctx, bl, br, css(0x000000, 0.32), 1.4);

  strokePoly(ctx, outer, palette.abyss, 4.5);
  strokeEdge(ctx, outer[0], outer[1], css(0xffffff, 0.45), 2);
}

function drawHighContrastGem(ctx: CanvasRenderingContext2D, fill: number): void {
  const cx = GEM_TEX / 2;
  const cy = GEM_TEX / 2;
  const s = GEM_TEX * 0.38;
  const outer = octagon(cx, cy, s, s * 0.16);
  const tablePts = square(cx, cy, s * 0.42);
  ctx.clearRect(0, 0, GEM_TEX, GEM_TEX);
  pathPoly(ctx, outer);
  ctx.fillStyle = css(fill);
  ctx.fill();
  strokePoly(ctx, outer, css(0xffffff, 0.9), 4);
  strokePoly(ctx, tablePts, css(0x000000, 0.55), 3);
}

function ensureGemTexture(scene: Phaser.Scene, color: TileColor, highContrast: boolean): string {
  const key = gemTextureKey(color, highContrast);
  if (scene.textures.exists(key)) return key;

  const texture = scene.textures.createCanvas(key, GEM_TEX, GEM_TEX);
  if (!texture) return key;
  const ctx = texture.getContext();
  ctx.imageSmoothingEnabled = true;

  if (highContrast) {
    drawHighContrastGem(ctx, HIGH_CONTRAST_COLORS[color].fill);
  } else {
    const src = TILE_COLORS[color];
    drawRealisticGem(ctx, buildPalette(src.fill, src.glow, src.border));
  }

  texture.refresh();
  return key;
}

function octagonPoints(half: number): Point[] {
  const s = half * 0.9;
  const cut = s * 0.12;
  return octagon(0, 0, s, cut);
}

function strokePolygon(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  color: number,
  width: number,
  alpha = 1,
): void {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
  g.closePath();
  g.strokePath();
}

function fillPolygon(g: Phaser.GameObjects.Graphics, points: Point[], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
  g.closePath();
  g.fillPath();
}

function resolveStroke(state: TileVisualState, border: number): { color: number; width: number } {
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

  return { color: strokeColor, width: strokeW };
}

function addStar(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  size: number,
  glyphColor: string,
  stroke = true,
): void {
  const star = scene.add
    .text(0, 0, '★', {
      fontSize: `${Math.max(14, Math.round(size * 0.4))}px`,
      color: glyphColor,
      fontStyle: 'bold',
      ...(stroke ? { stroke: '#000000', strokeThickness: 3 } : {}),
    })
    .setOrigin(0.5);
  container.add(star);
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
  return { container, hitArea, faceCenterY: 0 };
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

  parts.faceCenterY = 0;
  const outline = octagonPoints(size / 2);

  if (!color) {
    const empty = scene.add.graphics();
    fillPolygon(empty, outline, 0x14101f, 0.4);
    strokePolygon(empty, outline, 0x2a2540, 1, 0.6);
    container.addAt(empty, 0);
    return;
  }

  const border = state.highContrast
    ? HIGH_CONTRAST_COLORS[color].border
    : TILE_COLORS[color].border;
  const { color: strokeColor, width: strokeW } = resolveStroke(state, border);

  const key = ensureGemTexture(scene, color, state.highContrast);
  const gem = scene.add.image(0, 0, key).setDisplaySize(size, size);
  container.addAt(gem, 0);

  const rim = scene.add.graphics();
  strokePolygon(rim, outline, strokeColor, strokeW, 1);
  container.addAt(rim, 1);

  if (state.wildcardReward && isSecondary(color)) addStar(scene, container, size, '#ffffaa');
  if (state.wildcardBonus && color !== 'wildcard') addStar(scene, container, size, '#ffee00');
  if (color === 'wildcard') addStar(scene, container, size, '#ffffff', false);
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
