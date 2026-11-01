"use strict";

export default class CustomModal extends Phaser.GameObjects.Container {
  constructor(scene, socket, playerId, textObject) {
    super(scene);
  
    this.socket = socket;
    this.textObject = textObject; // Store the textObject reference

   

    // Create the input field
    const options = { fill: "#ffffff", font: "22px Arial"};
    this.nameInput = this.scene.add.dom(52, 20, 'input', options);
    this.nameInput.node.placeholder = 'Enter a new name...';
    this.add(this.nameInput);

     // Create the close button
     const closeButton = scene.add.text(10, 80, 'Submit', { font: '22px Arial', fill: '#000000' });
     closeButton.setOrigin(0.5);
     closeButton.setPadding(5);
     closeButton.setStyle({ backgroundColor: '#FFF' })
     closeButton.setInteractive();
     closeButton.on('pointerdown', () => {
       const newName = this.nameInput.node.value;
       if (newName && newName.trim().length > 0) {
         this.textObject.text = newName;
         sessionStorage.setItem(`playerName${playerId}`, newName);
         sessionStorage.setItem('userName', newName);
         this.socket.emit('nameUpdate', newName, socket.id, playerId);
         this.hide();
       }
     });
     this.add(closeButton);

    // Apply CSS styles to the input element to control its size
const inputElement = this.nameInput.node;
inputElement.style.width = '210px'; // Set the width of the input box (adjust this value as needed)
inputElement.style.height = '40px'; // Set the height of the input box (adjust this value as needed)

    // Add the modal to the scene
    scene.add.existing(this);

    // Hide the modal by default
    this.setVisible(false);

    this.closeCallback = null;
  }

  // Show the modal
  show() {
    // Clear the previous input field's value
    this.nameInput.node.value = "";

    // ... (rest of the code)
    this.setVisible(true);

    // Move the modal content to the center of the board
    const camera = this.scene.cameras.main;
    this.setPosition(400, 350);
  }

  // Hide the modal
  hide() {
    // ... (rest of the code)
    this.setVisible(false);
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  setCloseCallback(callback) {
    this.closeCallback = callback;
  }
}
