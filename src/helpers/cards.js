"use strict"

export default class Card {
    constructor(scene) {
        this.render = (x, y, sprite, frame) => {
            //console.log('card render', x,y,sprite, frame);
            let card = scene.add.image(x, y, sprite, frame)
                .setInteractive({ useHandCursor: true, draggable: true});
            return card;
        }
        
    }
}


