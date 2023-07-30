
const socket = io({ transports: ["websocket"] });
   
   function snapMarble(obj, groupObj) {
    this.gameObject = obj
    this.children.bringToTop(this.gameObject)
    this.gameObject.x = groupObj.x
    this.gameObject.y = groupObj.y
    socket.emit('snapMarbleclient', this.gameObject)
  }
  
  let yellowBlueMarbles = (obj, playersmarble) => {
    //console.log('yellowBlue Marble FUNCTION: ', obj.frame.name, playersmarble.frame.name)

    const bhfWithBlue = this.physics.world.overlap([r1, r2, r3, r4, r5], RightHome)
    const bhfWithYellow = this.physics.world.overlap([l1, l2, l3, l4, l5], RightHome)
    const bhfWithRed = this.physics.world.overlap([b1, b2, b3, b4, b5], RightHome)
    const bhfWithGreen = this.physics.world.overlap([t1, t2, t3, t4, t5], RightHome)
    const yhfWithBlue = this.physics.world.overlap([r1, r2, r3, r4, r5], LeftHome)
    const yhfWithYellow = this.physics.world.overlap([l1, l2, l3, l4, l5], LeftHome)
    const yhfWithRed = this.physics.world.overlap([b1, b2, b3, b4, b5], LeftHome)
    const yhfWithGreen = this.physics.world.overlap([t1, t2, t3, t4, t5], LeftHome)

    if (obj.frame.name === playersmarble.frame.name) {
       objdragStart(obj)
          } else if (obj.frame.name === 'b' && playersmarble.frame.name === 'y' && yhfWithYellow) {
              modal.setMessage('Yellow Home entrance is occupied with a Yellow Marble already.\n');
              modal.show();
              objdragStart(obj)
          } else if (obj.frame.name === 'y' && playersmarble.frame.name === 'b' && bhfWithBlue) {
                  modal.setMessage('Blue Home entrance is occupied with a Blue Marble already.\n');
                  modal.show();
                  objdragStart(obj)
          } else if (obj.frame.name === 'b' && playersmarble.frame.name === 'y' && bhfWithYellow && yhfWithBlue) {
                      modal.setMessage('Blue Home entrance is blocked as Blue marble at Yellow Home entrance is also block by Yellow marble at the Blue Home entrance.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'y' && playersmarble.frame.name === 'b' && bhfWithYellow && yhfWithBlue) {
                          modal.setMessage('Yellow Home entrance is blocked as Yellow marble at Blue Home entrance is also block by Blue marble at the Yellow Home entrance.\n');
                          modal.show();
                          objdragStart(obj)
          } else if (obj.frame.name === 'b' && playersmarble.frame.name === 'y' && bhfWithBlue && yhfWithBlue) {
                              modal.setMessage('Blue Home entrance and Yellow Home entrance are both occupied with BLUE Marbles.\n');
                              modal.show();
                              objdragStart(obj)
          } else if (obj.frame.name === 'y' && playersmarble.frame.name === 'b' && bhfWithYellow && yhfWithYellow) {
                                  modal.setMessage('Yellow Home entrance and Blue Home entrance are both occupied with YELLOW Marbles.\n');
                                  modal.show();
                                  objdragStart(obj)
          } else if (obj.frame.name === 'y' && playersmarble.frame.name === 'b') {
                                      if (bhfWithYellow) {
                                          this.physics.world.overlap([l1, l2, l3, l4, l5], RightHome, move_partners_Marble)
                                          this.physics.world.overlap([t1, t2, t3, t4, t5], LeftHome, move_opponets_Marble)
                                          this.physics.world.overlap([b1, b2, b3, b4, b5], LeftHome, move_opponets_Marble)
                                      }   else if (bhfWithRed) {
                                           this.physics.world.overlap([b1, b2, b3, b4, b5], RightHome, move_opponets_Marble)
                                      }   else if (bhfWithGreen) {
                                           this.physics.world.overlap([t1, t2, t3, t4, t5], RightHome, move_opponets_Marble)
                                      }
                                      playerHome(playersmarble, obj)
          } else if (obj.frame.name === 'b' && playersmarble.frame.name === 'y') {
                                          if (yhfWithBlue) {
                                              this.physics.world.overlap([r1, r2, r3, r4, r5], LeftHome, move_partners_Marble)
                                              this.physics.world.overlap([b1, b2, b3, b4, b5], RightHome, move_opponets_Marble)
                                              this.physics.world.overlap([t1, t2, t3, t4, t5], RightHome, move_opponets_Marble)
                                          } else if (yhfWithRed) {
                                              this.physics.world.overlap([b1, b2, b3, b4, b5], LeftHome, move_opponets_Marble)
                                          } else if (yhfWithGreen) {
                                              this.physics.world.overlap([t1, t2, t3, t4, t5], LeftHome, move_opponets_Marble)
                                          }
                                          playerHome(playersmarble, obj)
          } else if ((obj.frame.name === 'g' || obj.frame.name === 'r') && (playersmarble.frame.name === 'b' || playersmarble.frame.name === 'y')) {
                                              playerStart(playersmarble, obj)
                                          }
  } // end of yellowBlueMarbles

  let greenRedMarbles = (obj, playersmarble) => {
    //console.log('yellowBlue Marble FUNCTION: ', obj.frame.name, playersmarble.frame.name)

    const rhfWithBlue = this.physics.world.overlap([r1, r2, r3, r4, r5], BottomHome)
    const rhfWithYellow = this.physics.world.overlap([l1, l2, l3, l4, l5], BottomHome)
    const rhfWithRed = this.physics.world.overlap([b1, b2, b3, b4, b5], BottomHome)
    const rhfWithGreen = this.physics.world.overlap([t1, t2, t3, t4, t5], BottomHome)
    const ghfWithBlue = this.physics.world.overlap([r1, r2, r3, r4, r5], TopHome)
    const ghfWithYellow = this.physics.world.overlap([l1, l2, l3, l4, l5], TopHome)
    const ghfWithRed = this.physics.world.overlap([b1, b2, b3, b4, b5], TopHome)
    const ghfWithGreen = this.physics.world.overlap([t1, t2, t3, t4, t5], TopHome)

    if (obj.frame.name === playersmarble.frame.name) {
              objdragStart(obj)
          } else if (obj.frame.name === 'g' && playersmarble.frame.name === 'r' && rhfWithRed) {
                      modal.setMessage('Red Home entrance is occupied with a RED Marble already.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'r' && playersmarble.frame.name === 'g' && ghfWithGreen) {
                      modal.setMessage('Green Home entrance is occupied with a GREEN Marble already.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'g' && playersmarble.frame.name === 'r' && ghfWithRed && rhfWithGreen) {
                      modal.setMessage('Green Home entrance is blocked as Green marble at Red Home entrance is also block by Red marble at the Green Home entrance.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'r' && playersmarble.frame.name === 'g' && ghfWithRed && rhfWithGreen) {
                      modal.setMessage('Red Home entrance is blocked as Red marble at Green Home entrance is also block by Green marble at the Red Home entrance.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'g' && playersmarble.frame.name === 'r' && ghfWithGreen && rhfWithGreen) {
                      modal.setMessage('Green Home entrance and Red Home entrance are both occupied with GREEN Marbles.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'r' && playersmarble.frame.name === 'g' && ghfWithRed && rhfWithRed) {
                      modal.setMessage('Red Home entrance and Green Home entrance are both occupied with RED Marbles.\n');
                      modal.show();
                      objdragStart(obj)
          } else if (obj.frame.name === 'r' && playersmarble.frame.name === 'g') {
                      // Check to see if red home is occupied, if so move marble
                      if (ghfWithRed) {
                          // console.log('gh occupied with red marble')
                          this.physics.world.overlap([b1, b2, b3, b4, b5], TopHome, move_partners_Marble)
                          this.physics.world.overlap([r1, r2, r3, r4, r5], BottomHome, move_opponets_Marble)
                          this.physics.world.overlap([l1, l2, l3, l4, l5], BottomHome, move_opponets_Marble)
                      } else if (ghfWithBlue) {
                          this.physics.world.overlap([r1, r2, r3, r4, r5], TopHome, move_opponets_Marble)
                      } else if (ghfWithYellow) {
                          this.physics.world.overlap([l1, l2, l3, l4, l5], TopHome, move_opponets_Marble)
                      }
                      playerHome(playersmarble, obj)
          } else if (obj.frame.name === 'g' && playersmarble.frame.name === 'r') {
                          if (rhfWithGreen) {
                              this.physics.world.overlap([t1, t2, t3, t4, t5], BottomHome, move_partners_Marble)
                              this.physics.world.overlap([r1, r2, r3, r4, r5], TopHome, move_opponets_Marble)
                              this.physics.world.overlap([l1, l2, l3, l4, l5], TopHome, move_opponets_Marble)
                          } else if (rhfWithBlue) {
                              this.physics.world.overlap([r1, r2, r3, r4, r5], BottomHome, move_opponets_Marble)
                          } else if (rhfWithYellow) {
                              this.physics.world.overlap([l1, l2, l3, l4, l5], BottomHome, move_opponets_Marble)
                          }
                          playerHome(playersmarble, obj)
          } else if ((obj.frame.name === 'b' || obj.frame.name === 'y') && (playersmarble.frame.name === 'g' || playersmarble.frame.name === 'r')) {
                              playerStart(playersmarble, obj)
                          }

  } // end of greenRedMarbles

  export {snapMarble, yellowBlueMarbles, greenRedMarbles}
