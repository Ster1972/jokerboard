import Game from '../scenes/game.js';

const config = {
    type: Phaser.AUTO,
    audio: {disableWebAudio: true},
    parent: 'phaser-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: 1490,
        height: 825,
    },
    dom: {
        createContainer: true
    },
    backgroundColor: '#0040C1',
    physics: {
        default: 'arcade',
        arcade: { debug: false}
    },
    title: 'Joker4P'

}

const game = new Phaser.Game(config)

game.scene.add('game', Game, true)