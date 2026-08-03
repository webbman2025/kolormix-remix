import Phaser from 'phaser';

export function drawGameBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const scale = Math.min(width / 390, height / 844);

  objects.push(scene.add.rectangle(width / 2, height / 2, width, height, 0x0a0614).setDepth(0));

  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x1a0830, 0.25);
  g.fillCircle(width * 0.5, height * 0.62, 120 * scale);
  g.fillCircle(width * 0.2, height * 0.72, 80 * scale);
  g.fillCircle(width * 0.82, height * 0.68, 90 * scale);

  const accents = [
    { x: width * 0.18, y: height * 0.58, c: 0x00ffcc, a: 0.06 },
    { x: width * 0.82, y: height * 0.55, c: 0xff00aa, a: 0.08 },
    { x: width * 0.5, y: height * 0.82, c: 0xffaa00, a: 0.05 },
  ];
  for (const a of accents) {
    g.fillStyle(a.c, a.a);
    g.fillCircle(a.x, a.y, 50 * scale);
  }

  g.lineStyle(1, 0x4422aa, 0.15);
  g.strokeEllipse(width / 2, height * 0.68, width * 0.92, height * 0.45);
  objects.push(g);

  return objects;
}
