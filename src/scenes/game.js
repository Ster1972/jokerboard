"use strict";
import playerMarble from "../helpers/playerballs.js";
import boardHole from "../helpers/boardholes.js";
import Modal from "../helpers/modal.js"
import Zone from "../helpers/zone.js"
import Card from "../helpers/cards.js"
import h from "../helpers/videohelp.js"
import CustomModal from "../helpers/changename.js"

export default class Game extends Phaser.Scene {
  preload() {

    this.load.html('videodom', '/src/scenes/video.html');

    this.load.atlas(
      "sphere",
      "/src/images/marbles.png",
      "/src/images/marbles.json"
    )

    this.load.atlas(
      "cards",
      "/src/images/jokerdeck.png",
      "/src/images/jokerdeck.json"
    )
  }

  create() {
  
    let userName = sessionStorage.getItem("userName");
    let roomName = sessionStorage.getItem("roomName");
    let playerNum = ''
    let playershand = []
    let cards_in_dropZone = []
    let newcardplayed = false
    let answer = ''
    let myStream = ''
    let pc = []
    let screen = ''
    let socId = ''

    // add dom to scene - used for WEBRTC stuff 
    const container = this.add.dom(1375, 250).createFromCache('videodom');

    // Circle for connected players
    let c1 = this.add.circle(975, 105, 11, 0x000000)
    let c2 = this.add.circle(1005, 105, 11, 0x000000)
    let c3 = this.add.circle(1035, 105, 11, 0x000000)
    let c4 = this.add.circle(1065, 105, 11, 0x000000)
    console.log("session storage for Username =", userName, roomName, playerNum)

    const socket = io({ transports: ["websocket"] });

    socket.on("connect", () => {
      console.log("socket on connect: ", socket.id, socket.connected);//socket.io.engine
      playerNum = sessionStorage.getItem("playerNum")
      socId = socket.id
      console.log('socket iD ===== ', socId)
      socket.emit("joinServer", { 
        roomName: roomName,
        userName: userName, 
        playerNum: playerNum, 
        socketId: socId });
      socket.on("connectToRoom", (users) => {
        console.log('data recieved from server: ', users)
        let playerobj = users.filter((e) => e.player === userName);
        console.log('playerobj', playerobj)
        sessionStorage.setItem("playerNum", playerobj[0].playernum);

        let pp1 = users.some(p => p.playernum === '1')
        let pp2 = users.some(p => p.playernum === '2')
        let pp3 = users.some(p => p.playernum === '3')
        let pp4 = users.some(p => p.playernum === '4')

        pp1 ? c1.fillColor = 0x00ff00 : c1.fillColor = 0x000000
        pp2 ? c2.fillColor = 0x00ff00 : c2.fillColor = 0x000000
        pp3 ? c3.fillColor = 0x00ff00 : c3.fillColor = 0x000000
        pp4 ? c4.fillColor = 0x00ff00 : c4.fillColor = 0x000000

        let result1 = users.find((e) => e.playernum === '1')
        let result2 = users.find((e) => e.playernum === '2')
        let result3 = users.find((e) => e.playernum === '3')
        let result4 = users.find((e) => e.playernum === '4')
 
        if (result1 !== undefined) {
          playerName1Text.text = result1.player
          sessionStorage.setItem('playerName1', result1.player )
        }
        if (result2 !== undefined) {
          playerName2Text.text = result2.player
          sessionStorage.setItem('playerName2', result2.player )
        }
        if (result3 !== undefined) {
          playerName3Text.text = result3.player
          sessionStorage.setItem('playerName3', result3.player )
        }
        if (result4 !== undefined) {
          playerName4Text.text = result4.player
          sessionStorage.setItem('playerName4', result4.player )
        }
        
        });
    });

    socket.on('disconnect', () => {
      modal.setMessage('The game has detected that you are having a network issue. Please wait for the GREEN indicators to return.\n\n');
      modal.show(); 

      c1.fillColor = 0x000000
      c2.fillColor = 0x000000
      c3.fillColor = 0x000000
      c4.fillColor = 0x000000
      
    });

    // Call the boardHole function to create game board holes

    let { gameBoard, TopHome, RightHome, LeftHome, BottomHome, topHome, rightHome, leftHome, bottomHome } = boardHole(this)
    
 //----WebRTC 

  //Get user video 
  getAndSetUserStream();

 socket.on( 'new user', ( data ) => {
  socket.emit( 'newUserStart', { to: data.socketId, sender: socket.id} );
  pc.push( data.socketId );
  init( true, data.socketId );
} );


socket.on( 'newUserStart', ( data ) => {
  pc.push( data.sender );
  init( false, data.sender );
} );

socket.on( 'ice candidates', async ( data ) => {
  data.candidate ? await pc[data.sender].addIceCandidate( new RTCIceCandidate( data.candidate ) ) : '';
} );

socket.on( 'sdp', async ( data ) => {
  if ( data.description.type === 'offer' ) {
      data.description ? await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) ) : '';

      h.getUserFullMedia().then( async ( stream ) => {
          if ( !document.getElementById( 'local' ).srcObject ) {
              h.setLocalStream( stream );
          }

          //save my stream
          myStream = stream;

          stream.getTracks().forEach( ( track ) => {
              pc[data.sender].addTrack( track, stream );
          } );

          let answer = await pc[data.sender].createAnswer();

          await pc[data.sender].setLocalDescription( answer );

          socket.emit( 'sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socket.id } );
      } ).catch( ( e ) => {
          console.error( e );
      } );
  }

  else if ( data.description.type === 'answer' ) {
      await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) );
  }
} );


//When the video mute icon is clicked

document.getElementById('toggle-video').addEventListener('click', (e) => {e.preventDefault();

  let iconVideo = document.getElementById('buttonVideo')
  if (myStream.getVideoTracks()[0].enabled){
    if (e.target.classList.contains('btn-secondary')){
    iconVideo.className = 'bi bi-camera-video-off-fill'
    myStream.getVideoTracks()[0].enabled = false;
    }
    else if (e.target.classList.contains('bi-camera-video-fill') || e.target.classList.contains('btn-secondary')){
      e.target.classList.remove('bi-camera-video-fill');
      e.target.classList.add('bi-camera-video-off-fill');
      myStream.getVideoTracks()[0].enabled = false;
      }
    }
  else {
    if (e.target.classList.contains('btn-secondary')){
        iconVideo.className = 'bi bi-camera-video-fill'
        myStream.getVideoTracks()[0].enabled = true;
    }
    else if(e.target.classList.contains('bi-camera-video-off-fill') || e.target.classList.contains('btn-secondary')){
        e.target.classList.remove('bi-camera-video-off-fill');
        e.target.classList.add('bi-camera-video-fill');
        myStream.getVideoTracks()[0].enabled = true;
    }
  }
broadcastNewTracks(myStream, 'video')

})


//When the audio mute icon is clicked
document.getElementById('toggle-mute').addEventListener('click', (e) => {
e.preventDefault();
let iconAudio = document.getElementById('buttonAudio')
  if (myStream.getAudioTracks()[0].enabled){
    if (e.target.classList.contains('btn-secondary')){
      iconAudio.className = 'bi bi-mic-mute-fill'
      myStream.getAudioTracks()[0].enabled = false;
    }
    else if (e.target.classList.contains('bi-mic-fill')){
      e.target.classList.remove('bi-mic-fill');
      e.target.classList.add('bi-mic-mute-fill');
      myStream.getAudioTracks()[0].enabled = false;
      }
  }
  else {
    if (e.target.classList.contains('btn-secondary')){
        iconAudio.className = 'bi bi-mic-fill'
        myStream.getAudioTracks()[0].enabled = true;
    }
    else if(e.target.classList.contains('bi-mic-mute-fill')){
        e.target.classList.remove('bi-mic-mute-fill');
        e.target.classList.add('bi-mic-fill');
        myStream.getAudioTracks()[0].enabled = true;
    }
  }
broadcastNewTracks(myStream, 'audio')
});

socket.on('user-disconnected', (userId, playernum) => {
  console.log('user disconnected', userId, playernum, typeof playernum)
  if (document.getElementById( `${userId}-video`) ) {
      document.getElementById( `${userId}-video`).remove();
      if(playernum === '1') {
        playerName1Text.text = ''
        sessionStorage.removeItem('playerName1')
      } else if(playernum === '2') {
        playerName2Text.text = ''
        sessionStorage.removeItem('playerName2')
      } else if(playernum === '3') {
        playerName3Text.text = ''
        sessionStorage.removeItem('playerName3')
      } else if(playernum === '4') {
        playerName4Text.text = ''
        sessionStorage.removeItem('playerName4')
      }
  }
})

socket.on('updateName', (data, playernum) => {
  console.log('update the name on board', data, playernum, typeof playernum)
  if (playernum === 1){
    sessionStorage.setItem('playerName1', data)
    playerName1Text.text = data;
  } else if (playernum === 2){
    sessionStorage.setItem('playerName2', data)
    playerName2Text.text = data;
  } else if (playernum === 3){
    sessionStorage.setItem('playerName3', data)
    playerName3Text.text = data;
  } else if (playernum === 4){
    sessionStorage.setItem('playerName4', data)
    playerName4Text.text = data;
  }

})

    // ------------------ Players Marbles creation ------------------------
    // Top Marbles
    let t1 = playerMarble(this, 370, 100, 'sphere', 'g', 't1')
    let t2 = playerMarble(this, 370, 140, 'sphere', 'g', 't2')
    let t3 = playerMarble(this, 370, 180, 'sphere', 'g', 't3')
    let t4 = playerMarble(this, 330, 140, 'sphere', 'g', 't4')
    let t5 = playerMarble(this, 410, 140, 'sphere', 'g', 't5')

    // Right Marbles
    let r1 = playerMarble(this, 710, 370, 'sphere', 'b', 'r1')
    let r2 = playerMarble(this, 670, 370, 'sphere', 'b', 'r2')
    let r3 = playerMarble(this, 630, 370, 'sphere', 'b', 'r3')
    let r4 = playerMarble(this, 670, 330, 'sphere', 'b', 'r4')
    let r5 = playerMarble(this, 670, 410, 'sphere', 'b', 'r5')

    // Bottom Marbles
    let b1 = playerMarble(this, 450, 720, 'sphere', 'r', 'b1')
    let b2 = playerMarble(this, 450, 680, 'sphere', 'r', 'b2')
    let b3 = playerMarble(this, 450, 640, 'sphere', 'r', 'b3')
    let b4 = playerMarble(this, 490, 680, 'sphere', 'r', 'b4')
    let b5 = playerMarble(this, 410, 680, 'sphere', 'r', 'b5')

    // Left Marbles
    let l1 = playerMarble(this, 100, 450, 'sphere', 'y', 'l1')
    let l2 = playerMarble(this, 140, 450, 'sphere', 'y', 'l2')
    let l3 = playerMarble(this, 180, 450, 'sphere', 'y', 'l3')
    let l4 = playerMarble(this, 140, 490, 'sphere', 'y', 'l4')
    let l5 = playerMarble(this, 140, 410, 'sphere', 'y', 'l5')

    // Create Modal
    const modal = new Modal(this, 400, 400, 300, 300, '', socket);

    // Create Drop Zone for playing cards
    this.zone = new Zone(this)
    this.dropZone = this.zone.renderZone(1025, 375, 170, 220)
    this.zone.renderOutline(this.dropZone)

    // Game text info
    this.resetGame = this.add.text(964, 40, 'New Game', { fontSize: 'bold 24px' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => socket.emit('dealCardsclient'))
        .on('pointerover', () => this.resetGame.setStyle({ fill: '#ff0000' }))
        .on('pointerout', () => this.resetGame.setStyle({ fill: '#ffffff' }))

    this.resetGame.setVisible(true)
    
    const options = { font: '18px Arial', fill: '#ffffff', align: 'center',}

    const playerName1Text = this.add.text(t3.x, t3.y + 32, '', options).setOrigin(0.5);
    playerName1Text.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      customModalOne.show();
    });

    const playerName2Text = this.add.text(r5.x, r5.y + 32, '', options).setOrigin(0.5);
    playerName2Text.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
       customModalTwo.show();
    });

    const playerName3Text = this.add.text(b3.x, b3.y-32, '', options).setOrigin(0.5);
    playerName3Text.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      customModalThree.show();
   });

    const playerName4Text = this.add.text(l5.x, l5.y-32, '', options).setOrigin(0.5);
    playerName4Text.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      customModalFour.show();
   });
    
   const customModalOne = new CustomModal(this, socket, 1, playerName1Text);
   const customModalTwo = new CustomModal(this, socket, 2, playerName2Text);
   const customModalThree = new CustomModal(this, socket, 3, playerName3Text);
   const customModalFour = new CustomModal(this, socket, 4, playerName4Text);


    this.textMarker = this.add.text(0, 0, '*', { color: 'white', fontSize: 'bold 60px', align: 'center'}).setOrigin(0.5);
    this.textMarker.setVisible(false);

    this.colorsturn = this.add.text(1025, 190, '', { color: 'white', fontSize: 'bold 30px', align: 'center' }).setOrigin(0.5)


    
    
    // ---- Player Ball lookup table   
    const playerBallLookup = {
      'top1': t1, 'top2': t2, 'top3': t3, 'top4': t4, 'top5': t5, 'left1': l1, 'left2': l2, 'left3': l3, 'left4': l4, 'left5': l5,
      'right1': r1, 'right2': r2, 'right3': r3, 'right4': r4, 'right5': r5, 'bottom1': b1, 'bottom2': b2, 'bottom3': b3, 'bottom4': b4, 'bottom5': b5
    }

    const keys = Object.keys(playerBallLookup)

    // ---- Incoming socket data

    socket.on('playerWarning',  () => {
      modal.setCloseCallback(() => {
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("roomName");
        sessionStorage.removeItem("playerNum")
        sessionStorage.removeItem('playerName1')
        sessionStorage.removeItem('playerName2')
        sessionStorage.removeItem('playerName3')
        sessionStorage.removeItem('playerName4')
        socket.disconnect();
        window.location.href = "../../index.html";
      });
      modal.setMessage('This game has four players already. Please choose another Game Name.\n');
      modal.show(); 
    })

    socket.on('alertmsg', () => {
      modal.setMessage('Not all four players have joined the game yet.\n');
      modal.show();
    })

    socket.on('winners', (data) => {
      this.resetGame.setVisible(true)
      this.textMarker.setVisible(false)
      answer = ''
      this.colorsturn.text = ''
      if(data === 'yb'){
        modal.setMessage(`${sessionStorage.getItem('playerName4')} and ${sessionStorage.getItem('playerName2')} are the winners.\n`);
        modal.show(); 
      } else if (data === 'gr'){
        modal.setMessage(`${sessionStorage.getItem('playerName1')} and ${sessionStorage.getItem('playerName3')} are the winners.\n`);
        modal.show(); 
      }
    })

    socket.on('closeModalBox', () => {
      modal.hide()
    })

    socket.on('colourturn', (data) => {
      this.colorsturn.text = data
      //console.log('color text data', this.colorsturn.text)
   })

    socket.on("moveObject", (obj) => {
      this.gameObject = playerBallLookup[obj.name];
      this.gameObject.x = obj.x
      this.gameObject.y = obj.y
    });

    socket.on("marker", (posX, posY) => {
      this.textMarker.setPosition(posX, posY);
      this.textMarker.setVisible(true);
    })

    socket.on("snapMarbleServer", (obj) => {
      this.gameObject = playerBallLookup[obj.name]
      this.gameObject.x = obj.x
      this.gameObject.y = obj.y
    })

    socket.on('otherplayer', (obj) => {
      this.gameObject = playerBallLookup[obj.name]
      this.gameObject.x = obj.x
      this.gameObject.y = obj.y
    })

    // cardPlayed - shows the card being played by the other player(s)
    socket.on('cardPlayed', (gameObj) => {
      newcardplayed = true
      let playerCard = new Card(this);
      let obj = playerCard.render(1025, 375, 'cards', gameObj)
      obj.name = gameObj
      obj.setDepth(100).disableInteractive({ useHandCursor: false, draggable: false})
      cards_in_dropZone.push(obj)
    })

  socket.on('startNewGame', () => {
    this.resetGame.setVisible(false)
    if(playershand.length > 0) {
      for (let i = 0; i < playershand.length; i++) {
        playershand[i].destroy()
    }}

    if(cards_in_dropZone.length > 0) {
      for (let i = 0; i < cards_in_dropZone.length; i++) {
        cards_in_dropZone[i].destroy()
    }}

    playershand = []
    cards_in_dropZone = []
    
    // reset marble position for a new game
    t1.x = 370, t1.y = 100, t2.x = 370, t2.y = 140, t3.x = 370, t3.y = 180, t4.x = 330, t4.y = 140, t5.x = 410, t5.y = 140,
    r1.x = 710, r1.y = 370, r2.x = 670, r2.y = 370, r3.x = 630, r3.y = 370, r4.x = 670, r4.y = 330, r5.x = 670, r5.y = 410,
    b1.x = 450, b1.y = 720, b2.x = 450, b2.y = 680, b3.x = 450, b3.y = 640, b4.x = 490, b4.y = 680, b5.x = 410, b5.y = 680,
    l1.x = 100, l1.y = 450, l2.x = 140, l2.y = 450, l3.x = 180, l3.y = 450, l4.x = 140, l4.y = 490, l5.x = 140, l5.y = 410

  })

  socket.on('cards', (hand) => {
    //console.log('dealt hand', hand)
    //Deal initial hand
    for (let i = 0; i < 6; i++) {
        let playerCard = new Card(this);
        let obj = playerCard.render(900 + (i * 50), 680, 'cards', hand[i]).setDepth(i)
        obj.name = hand[i]
        playershand.push(obj)
        
    }
  })

  socket.on('newcard', (newcard, pos) => {
    let card = new Card(this)
    let obj = card.render(900 + (pos * 50), 680, 'cards', newcard)
    obj.setDepth(pos)
    obj.name = newcard
    playershand.splice(pos, 1)  // remove image from array
    playershand.splice(pos, 0, obj)  // place image into array at the same position
 })

    socket.on('updateGameState', (data, cardhand, lastcardplayed) => {
     //console.log('game update recieved::::: ----->', cardhand, lastcardplayed )
      if (data.length !== 0) {
        t1.x = data[0][1].x, t1.y = data[0][1].y, t2.x = data[0][2].x, t2.y = data[0][2].y
        t3.x = data[0][3].x, t3.y = data[0][3].y, t4.x = data[0][4].x, t4.y = data[0][4].y, t5.x = data[0][5].x, t5.y = data[0][5].y
        r1.x = data[0][6].x, r1.y = data[0][6].y, r2.x = data[0][7].x, r2.y = data[0][7].y
        r3.x = data[0][8].x, r3.y = data[0][8].y, r4.x = data[0][9].x, r4.y = data[0][9].y, r5.x = data[0][10].x, r5.y = data[0][10].y
        b1.x = data[0][11].x, b1.y = data[0][11].y, b2.x = data[0][12].x, b2.y = data[0][12].y
        b3.x = data[0][13].x, b3.y = data[0][13].y, b4.x = data[0][14].x, b4.y = data[0][14].y, b5.x = data[0][15].x, b5.y = data[0][15].y
        l1.x = data[0][16].x, l1.y = data[0][16].y, l2.x = data[0][17].x, l2.y = data[0][17].y
        l3.x = data[0][18].x, l3.y = data[0][18].y, l4.x = data[0][19].x, l4.y = data[0][19].y, l5.x = data[0][20].x, l5.y = data[0][20].y
        this.colorsturn.text = data[0][21]
        this.resetGame.setVisible(data[0][22])
      }
      playershand = []
      cards_in_dropZone = []

    // redisplay players hand
      if(cardhand.length !== 0){

        for (let i = 0; i < 6; i++) {
          let playerCard = new Card(this);
          let obj = playerCard.render(900 + (i * 50), 680, 'cards', cardhand[i]).setDepth(i)
          obj.name = cardhand[i]
          playershand.push(obj)
        } 
        this.resetGame.setVisible(false)
      }
    
    // redisplay DropZone card
      if(lastcardplayed.length !== 0){
        let playerCard = new Card(this);
        let obj = playerCard.render(1025, 375, 'cards', lastcardplayed)
        obj.setDepth(100).disableInteractive({ useHandCursor: false, draggable: false})
        cards_in_dropZone.push(obj)
      }
     })

    //---- Game Play Area

    this.input.on('gameobjectover', (pointer, gameObject) => {
      if (gameObject.type !== 'Zone' && !keys.includes(gameObject.name)){
        gameObject.setTint(0x7878ff)
      }
   })

   this.input.on('gameobjectout', (pointer, gameObject) => {
       if (gameObject.type !== 'Zone' && !keys.includes(gameObject.name)){
           gameObject.clearTint()
       }
   })

    this.input.on("dragstart",  (pointer, gameObject) => {
      this.children.bringToTop(gameObject)
      if(keys.includes(gameObject.name)){
        this.textMarker.setPosition(gameObject.x, gameObject.y+5);
        this.textMarker.setVisible(true);
        socket.emit('markerclient', gameObject.x, gameObject.y+5)
      }
     });

    this.input.on("dragend", (pointer, gameObject, dropped) => {
      let ghf = homefull(t1, t2, t3, t4, t5, topHome)
      let bhf = homefull(r1, r2, r3, r4, r5, rightHome)
      let rhf = homefull(b1, b2, b3, b4, b5, bottomHome)
      let yhf = homefull(l1, l2, l3, l4, l5, leftHome)

      if (!dropped && !keys.includes(gameObject.name)) {  // if card is not dropped in dropZone return to hand
        gameObject.x = gameObject.input.dragStartX
        gameObject.y = gameObject.input.dragStartY
        gameObject.setDepth(playershand.indexOf(gameObject))

      } else if (dropped && !keys.includes(gameObject.name) ){  // what happens when card is dropped in dropZone
          gameObject.x = this.dropZone.x
          gameObject.y = this.dropZone.y
          gameObject.setDepth(100)
          gameObject.clearTint()
          gameObject.disableInteractive({ useHandCursor: false, draggable: false})
          gameObject.input.enabled = false
          newcardplayed = true
          socket.emit('cardPlayedclient', gameObject.frame.name, sessionStorage.getItem('playerNum'), playershand.indexOf(gameObject), socket.id)
          gameObject.destroy()

      } else if (!dropped && keys.includes(gameObject.name)){  // what happens when marble is moved
        if (newcardplayed){
          playersturn(gameObject, ghf, yhf, rhf, bhf)
          newcardplayed = false
        }
         
          //-- causes marble to snap into place
          this.physics.world.overlap(gameObject, [gameBoard, topHome, leftHome, rightHome, bottomHome], snapMarble, null, this);

          //-- handles moving marbles for players
          this.physics.world.overlap(gameObject, [l1, l2, l3, l4, l5, r1, r2, r3, r4, r5], yellowBlueMarbles)
          this.physics.world.overlap(gameObject, [t1,t2,t3,t4,t5,b1,b2,b3,b4,b5], greenRedMarbles)
          const newGameButtonStatus = this.resetGame.visible;
          //console.log('reset status', newGameButtonStatus)
          //-- updates the server on the marblestate which should be the same for everyone
          this.marblestate = [roomName, t1, t2, t3, t4, t5, r1, r2, r3, r4, r5, b1, b2, b3, b4, b5, l1, l2, l3, l4, l5, this.colorsturn.text, newGameButtonStatus]
         
          socket.emit('marbleState', this.marblestate)
     }
     // -- updates the server on the marblestate of this player
      

    // ************** determine if there is a winner **************************
      if (ghf && rhf) {
        let winner = 'gr'
        socket.emit('winner', winner)
      }
      if (yhf && bhf) {
          let winner = 'yb'
          socket.emit('winner', winner)
      }

    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
      if (keys.includes(gameObject.name)) {
        socket.emit("objMoveData", gameObject);
    }
  
    });


// -- function section --


    let snapMarble = (obj, groupObj) => {
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
     // console.log('yellowBlue Marble FUNCTION: ', obj.frame.name, playersmarble.frame.name)

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


    function objdragStart(obj) {
        obj.x = obj.input.dragStartX
        obj.y = obj.input.dragStartY
      }

    function move_partners_Marble(item) {
        item.x = item.getData('homeX')
        item.y = item.getData('homeY')
        socket.emit('player', item)
    }

    function move_opponets_Marble(item) {
        item.x = item.getData('X')
        item.y = item.getData('Y')
        socket.emit('player', item)
    }


    function playerStart(pos, obj) {
        obj.x = pos.x
        obj.y = pos.y
        pos.x = pos.getData('X')
        pos.y = pos.getData('Y')
        socket.emit('player', pos)
    }

    function playerHome(pos, obj) {
        obj.x = pos.x
        obj.y = pos.y
        pos.x = pos.getData('homeX')
        pos.y = pos.getData('homeY')
        socket.emit('player', pos)
    }

    let playersturn = (obj, greenfull, yellowfull, redfull, bluefull) => {
      //console.log('colour', obj.frame.name, answer, greenfull, yellowfull, redfull, bluefull)

       if (obj.frame.name === 'g' && yellowfull && answer === `${sessionStorage.getItem('playerName3')}'s turn\nmoving Green`) {
           answer = `${sessionStorage.getItem('playerName4')}'s turn\nmoving Blue`
       } else
           if (obj.frame.name === 'g' && answer === `${sessionStorage.getItem('playerName3')}'s turn\nmoving Green`) {
               answer = `${sessionStorage.getItem('playerName4')}'s turn`
           } else
               if (obj.frame.name === 'g' && bluefull) {
                   answer = `${sessionStorage.getItem('playerName2')}'s turn\nmoving Yellow`
               } else
                   if (obj.frame.name === 'g') {
                       answer = `${sessionStorage.getItem('playerName2')}'s turn`

           } else
           if (obj.frame.name === 'b' && greenfull && answer === `${sessionStorage.getItem('playerName4')}'s turn\nmoving Blue`) {
               answer = `${sessionStorage.getItem('playerName1')}'s turn\nmoving Red`
           } else
               if (obj.frame.name === 'b' && answer === `${sessionStorage.getItem('playerName4')}'s turn\nmoving Blue`) {
                   answer = `${sessionStorage.getItem('playerName1')}'s turn`
               } else
                   if (obj.frame.name === 'b' && redfull) {
                       answer = `${sessionStorage.getItem('playerName3')}'s turn\nmoving Green`
                   } else
                       if (obj.frame.name === 'b') {
                           answer = `${sessionStorage.getItem('playerName3')}'s turn`

           } else
           if (obj.frame.name === 'r' && bluefull && answer === `${sessionStorage.getItem('playerName1')}'s turn\nmoving Red`) {
               answer = `${sessionStorage.getItem('playerName2')}'s turn\nmoving Yellow`
           } else
               if (obj.frame.name === 'r' && answer === `${sessionStorage.getItem('playerName1')}'s turn\nmoving Red`) {
                   answer = `${sessionStorage.getItem('playerName2')}'s turn`
               } else
                   if (obj.frame.name === 'r' && yellowfull) {
                       answer = `${sessionStorage.getItem('playerName4')}'s turn\nmoving Blue`
                   } else
                       if (obj.frame.name === 'r') {
                           answer = `${sessionStorage.getItem('playerName4')}'s turn`

           } else
           if (obj.frame.name === 'y' && redfull && answer === `${sessionStorage.getItem('playerName2')}Blue's turn\nmoving Yellow`) {
               answer = `${sessionStorage.getItem('playerName3')}'s turn\nmoving Green`
           } else
               if (obj.frame.name === 'y' && answer === `Blue's turn\nmoving Yellow`) {
                   answer = `${sessionStorage.getItem('playerName3')}'s turn`
               } else
                   if (obj.frame.name === 'y' && greenfull) {
                       answer = `${sessionStorage.getItem('playerName1')}'s turn\nmoving Red`
                   } else
                       if (obj.frame.name === 'y') {
                           answer = `${sessionStorage.getItem('playerName1')}'s turn`
                       }
       this.colorsturn.text = answer
       socket.emit('colourturnclient', answer)
   }

    //** Checks to see if home area is full of not */
   let homefull = (x1, x2, x3, x4, x5, Home) => {
      let p1 = this.physics.world.overlap(x1, Home)
      let p2 = this.physics.world.overlap(x2, Home)
      let p3 = this.physics.world.overlap(x3, Home)
      let p4 = this.physics.world.overlap(x4, Home)
      let p5 = this.physics.world.overlap(x5, Home)
      // console.log('homefull check',p1,p2,p3,p4,p5)
      if (p1 && p2 && p3 && p4 && p5) {
          return true
      } else {
          return false
      }
  }
//---------------------------------------------
 // -- webRTC function

 function getAndSetUserStream() {
  h.getUserFullMedia().then( ( stream ) => {
      //save my stream
      myStream = stream;

      h.setLocalStream( stream );
  } ).catch( ( e ) => {
      console.error( `stream error: ${ e }` );
  } );
}

function init( createOffer, partnerName ) {
  console.log("init- create offer",partnerName)
  pc[partnerName] = new RTCPeerConnection( h.getIceServer() );

  if ( screen && screen.getTracks().length ) {
      screen.getTracks().forEach( ( track ) => {
          pc[partnerName].addTrack( track, screen );//should trigger negotiationneeded event
      } );
  }

  else if ( myStream ) {
      myStream.getTracks().forEach( ( track ) => {
          pc[partnerName].addTrack( track, myStream );//should trigger negotiationneeded event
      } );
  }

  else {
      h.getUserFullMedia().then( ( stream ) => {
          //save my stream
          myStream = stream;

          stream.getTracks().forEach( ( track ) => {
              pc[partnerName].addTrack( track, stream );//should trigger negotiationneeded event
          } );

          h.setLocalStream( stream );
      } ).catch( ( e ) => {
          console.error( `stream error: ${ e }` );
      } );
  }



  //create offer
  if ( createOffer ) {
      pc[partnerName].onnegotiationneeded = async () => {
          let offer = await pc[partnerName].createOffer();

          await pc[partnerName].setLocalDescription( offer );

          socket.emit( 'sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socket.id } );
      };
  }



  //send ice candidate to partnerNames
  pc[partnerName].onicecandidate = ( { candidate } ) => {
      socket.emit( 'ice candidates', { candidate: candidate, to: partnerName, sender: socket.id } );
  };



  //add
  pc[partnerName].ontrack = ( e ) => {
      let str = e.streams[0];
      if ( document.getElementById( `${ partnerName }-video` ) ) {
          document.getElementById( `${ partnerName }-video` ).srcObject = str;
      }

      else {
          //video elem
          let newVid = document.createElement( 'video' );
          newVid.id = `${ partnerName }-video`;
          newVid.srcObject = str;
          newVid.autoplay = true;
          newVid.className = 'remote-video';
          newVid.disablePictureInPicture = true;
          videos.append(newVid);
  
          document.getElementById( 'videos' ).appendChild( newVid );

          //h.adjustVideoElemSize();
      }
  };



  pc[partnerName].onconnectionstatechange = ( d ) => {
      switch ( pc[partnerName].iceConnectionState ) {
          case 'disconnected':
          case 'failed':
              h.closeVideo( partnerName );
              break;

          case 'closed':
              h.closeVideo( partnerName );
              break;
      }
  };



  pc[partnerName].onsignalingstatechange = ( d ) => {
      switch ( pc[partnerName].signalingState ) {
          case 'closed':
              //console.log( "Signalling state is 'closed'" );
              h.closeVideo( partnerName );
              break;
      }
  };
}  // end of function

function broadcastNewTracks( stream, type, mirrorMode = true ) {
  h.setLocalStream( stream, mirrorMode );

  let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

  for ( let p in pc ) {
      let pName = pc[p];

      if ( typeof pc[pName] == 'object' ) {
          h.replaceTrack( track, pc[pName] );
      }
  }
}



//============================================
    
  } // --- end of PHASER CREATE function

  update() { }
}