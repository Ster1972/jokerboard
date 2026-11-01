"use strict"

export default class Card {
    constructor(scene) {
        this.scene = scene;
    }

    render(x, y, texture, frame) {
        return this.scene.add.image(x, y, texture, frame)
            .setInteractive({ useHandCursor: true, draggable: true });
    }
}

