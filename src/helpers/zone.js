"use strict"
       
export default class Zone {
    constructor(scene) {
        this.scene = scene;
    }

    renderZone(x, y, height, width) {
        return this.scene.add.zone(x, y, height, width)
            .setRectangleDropZone(height, width);
    }

    renderOutline(dropZone) {
        const outline = this.scene.add.graphics();
        const hitArea = dropZone.input.hitArea;

        outline.lineStyle(6, 0xffffff);
        outline.strokeRect(
            dropZone.x - hitArea.width / 2,
            dropZone.y - hitArea.height / 2,
            hitArea.width,
            hitArea.height
        );
    }
}