"use strict"
       
export default class Zone {
    constructor(scene) {
        this.renderZone = (x,y,h,w) => {
            let dropZone = scene.add.zone(x,y,h,w).setRectangleDropZone(h,w);
            //dropZone.setData({ cards: 0 });
            return dropZone;
        };
        this.renderOutline = (dropZone) => {
            let dropZoneOutline = scene.add.graphics();
            dropZoneOutline.lineStyle(6, 0xffffff);
            dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
        }
    }
}