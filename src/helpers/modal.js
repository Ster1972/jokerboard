"use strict"

export default class Modal extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, message, socket) {
      super(scene, x, y);

      this.socket = socket
  
      // Create the background rectangle
      const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
      background.setOrigin(0.5);
      this.add(background);
  
      // Create the message text
      this.messageText = scene.add.text(0, -20, message, { font: '24px Arial', fill: '#ffffff', wordWrap: { width: width - 40 } });
      this.messageText.setOrigin(0.5);
      this.add(this.messageText);
  
      // Create the close button
      const closeButton = scene.add.text(0, 40, 'Close', { font: '24px Arial', fill: '#000000' });
      closeButton.setOrigin(0.5);
      closeButton.setPadding(5);
      closeButton.setStyle({ backgroundColor: '#FFF'})
      closeButton.setInteractive();
      closeButton.on('pointerdown', () => {
        this.socket.emit('closeModal');
        this.hide();
      });
      this.add(closeButton);
  
      // Add the modal to the scene
      scene.add.existing(this);
  
      // Hide the modal by default
      this.setVisible(false);

      this.closeCallback = null;
    }
  
    
    // Show the modal
    show() {
      this.setVisible(true);
    }
  
    // Hide the modal
    hide() {
      this.setVisible(false);
      if (this.closeCallback) {
        this.closeCallback();
      }
    }
  
    // Update the message text
    setMessage(message) {
      this.messageText.setText(message);
    }

    setCloseCallback(callback) {
      this.closeCallback = callback;
    }
  }  



