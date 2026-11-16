"use strict";

const BOARD_BOUNDS = { x: 24, y: 24, width: 772, height: 772 };
const HOLE_RADIUS = 12;

export default function renderBoardVisuals(scene, holeGroups) {
  const graphics = scene.add.graphics().setDepth(0);
  const { x, y, width, height } = BOARD_BOUNDS;

  graphics.fillStyle(0x24170f, 0.45).fillRoundedRect(x + 5, y + 7, width, height, 22);
  graphics.fillStyle(0x5a351d).fillRoundedRect(x, y, width, height, 22);
  graphics.fillStyle(0xa36e3c).fillRoundedRect(x + 7, y + 7, width - 14, height - 14, 17);
  graphics.fillStyle(0xd0ad76).fillRoundedRect(x + 14, y + 14, width - 28, height - 28, 12);
  graphics.lineStyle(2, 0xf0d9ae, 0.7)
    .strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 8);

  for (let grainY = y + 38; grainY < y + height - 28; grainY += 18) {
    graphics.lineStyle(1, 0x815b34, 0.12);
    graphics.beginPath();
    graphics.moveTo(x + 24, grainY);
    graphics.lineTo(x + width - 24, grainY + 2);
    graphics.strokePath();
  }

  const holes = holeGroups.flatMap((group) => group.getChildren());
  for (const hole of holes) hole.setVisible(false);

  for (const hole of holes) {
    const isGrayTrackHole = hole.frame?.name === "h1";
    graphics.fillStyle(0x4d321f, 0.42).fillCircle(hole.x + 1, hole.y + 2, HOLE_RADIUS + 2);
    graphics.fillStyle(0x8c6339).fillCircle(hole.x, hole.y, HOLE_RADIUS + 1);
    graphics.lineStyle(1, 0xe2c18c, 0.8).strokeCircle(hole.x, hole.y, HOLE_RADIUS);
    graphics.fillStyle(0x442d1c).fillCircle(hole.x, hole.y, HOLE_RADIUS - 2);
    graphics.fillStyle(isGrayTrackHole ? 0x808080 : 0x17130f)
      .fillCircle(hole.x, hole.y, HOLE_RADIUS - 4);
    if (!isGrayTrackHole) {
      graphics.fillStyle(0x090909, 0.55).fillCircle(hole.x, hole.y + 1, HOLE_RADIUS - 6);
    }
  }

  return graphics;
}
