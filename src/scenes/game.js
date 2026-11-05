"use strict";
import playerMarble from "../helpers/playerballs.js";
import boardHole, { getNearestBoardHole } from "../helpers/boardholes.js";
import Modal from "../helpers/modal.js"
import Zone from "../helpers/zone.js"
import Card from "../helpers/cards.js"
import h from "../helpers/videohelp.js"
import CustomModal from "../helpers/changename.js"
import {
  BoundedIceCandidateQueue,
  SerializedOperations,
  addLocalTracks,
  shouldCreateOffer,
  canCreateOffer,
  configureCodecPreferences,
  validateIceServerConfig,
  isPeerCurrent
} from "../helpers/webrtc.js"

const MARBLE_LAYOUT = {
  top: {
    color: 'g',
    positions: [
      { x: 370, y: 100, id: 't1' },
      { x: 370, y: 140, id: 't2' },
      { x: 370, y: 180, id: 't3' },
      { x: 330, y: 140, id: 't4' },
      { x: 410, y: 140, id: 't5' },
    ],
  },
  right: {
    color: 'b',
    positions: [
      { x: 710, y: 370, id: 'r1' },
      { x: 670, y: 370, id: 'r2' },
      { x: 630, y: 370, id: 'r3' },
      { x: 670, y: 330, id: 'r4' },
      { x: 670, y: 410, id: 'r5' },
    ],
  },
  bottom: {
    color: 'r',
    positions: [
      { x: 450, y: 720, id: 'b1' },
      { x: 450, y: 680, id: 'b2' },
      { x: 450, y: 640, id: 'b3' },
      { x: 490, y: 680, id: 'b4' },
      { x: 410, y: 680, id: 'b5' },
    ],
  },
  left: {
    color: 'y',
    positions: [
      { x: 100, y: 450, id: 'l1' },
      { x: 140, y: 450, id: 'l2' },
      { x: 180, y: 450, id: 'l3' },
      { x: 140, y: 490, id: 'l4' },
      { x: 140, y: 410, id: 'l5' },
    ],
  },
};

export default class Game extends Phaser.Scene {
  preload() {

    this.load.html('videodom', '/src/scenes/video.html');
    this.load.image('origin-marker', '/src/images/origin-marker.png');

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
    let mediaStreamPromise = null
    let pc = {}
    let socId = ''
    let sessionToken = sessionStorage.getItem("sessionToken") || ""
    const movementIntervalMs = 1000 / 30
    let lastMovementSentAt = 0
    let lastSentMarblePosition = null
    let peerRecoveryTimers = new Map()
    let peerInitPromises = new Map()
    let signalingQueues = new Map()
    let candidateQueues = new Map()
    let remoteStreams = new Map()
    let peerGenerations = new Map()
    let webrtcStatsInterval = null

    // add dom to scene - used for WEBRTC stuff 
    this.add.dom(1375, 250).createFromCache('videodom');

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
        socketId: socId,
        sessionToken });
    });

    if (!socket._jokerSessionListenerRegistered) {
      socket._jokerSessionListenerRegistered = true;
      socket.on("session", (session) => {
        if (!session) return;
        playerNum = session.playerNum;
        sessionToken = session.sessionToken;
        sessionStorage.setItem("playerNum", playerNum);
        sessionStorage.setItem("sessionToken", sessionToken);
      });
    }

    if (!socket._jokerRoomListenerRegistered) {
      socket._jokerRoomListenerRegistered = true;
      socket.on("connectToRoom", (users) => {
        console.log('data recieved from server: ', users)
        let playerobj = users.filter((e) => e.player === userName);
        console.log('playerobj', playerobj)
        if (playerobj[0]) {
          playerNum = playerobj[0].playernum;
          sessionStorage.setItem("playerNum", playerNum);
        }

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
        reconcilePeerConnections(users);

        });
    }

    socket.on('disconnect', () => {
      modal.setMessage('The game has detected that you are having a network issue. Please wait for the GREEN indicators to return.\n\n');
      modal.show(); 

      for (const partnerName of Object.keys(pc)) {
        closePeerConnection(partnerName, true);
      }

      c1.fillColor = 0x000000
      c2.fillColor = 0x000000
      c3.fillColor = 0x000000
      c4.fillColor = 0x000000
      
    });

    // Call the boardHole function to create game board holes

    let { gameBoard, TopHome, RightHome, LeftHome, BottomHome, topHome, rightHome, leftHome, bottomHome } = boardHole(this)
    
 //----WebRTC 

 socket.on( 'new user', ( data ) => {
  socket.emit( 'newUserStart', { to: data.socketId, sender: socket.id} );
  init( true, data.socketId );
 } );


  socket.on( 'newUserStart', ( data ) => {
    init( false, data.sender );
  } );

socket.on( 'ice candidates', async ( data ) => {
 logWebRtc(data.sender, "icecandidate.received", {
   hasCandidate: Boolean(data.candidate)
 });
 const peer = pc[data.sender];
 if (!peer) {
   if (!candidateQueues.has(data.sender)) candidateQueues.set(data.sender, new BoundedIceCandidateQueue());
   candidateQueues.get(data.sender).push(data.candidate);
   await init(false, data.sender);
   return;
 }
 if (!data.candidate) return;
 if (!peer.remoteDescription) {
   if (!candidateQueues.has(data.sender)) candidateQueues.set(data.sender, new BoundedIceCandidateQueue());
   candidateQueues.get(data.sender).push(data.candidate);
   return;
 }
 const operations = signalingQueues.get(data.sender) || new SerializedOperations();
 signalingQueues.set(data.sender, operations);
 await operations.run(async () => {
   if (!isPeerCurrent(pc, data.sender, peer)) return;
   try {
     await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
   } catch (error) {
     console.error("ICE candidate rejected:", error);
   }
 });
} );

socket.on( 'sdp', async ( data ) => {
  if (!data.description || !["offer", "answer"].includes(data.description.type)) return;
  let peer = pc[data.sender];
  if (!peer) {
    await init(false, data.sender);
    peer = pc[data.sender];
  }
  if (!peer) return;
  try {
    const operations = signalingQueues.get(data.sender) || new SerializedOperations();
    signalingQueues.set(data.sender, operations);
    await operations.run(async () => {
      if (!isPeerCurrent(pc, data.sender, peer)) return;

      if (data.description.type === "offer") {
        const collision = peer.signalingState !== "stable";
        logWebRtc(data.sender, "setRemoteDescription.offer.start", {
          signalingState: peer.signalingState,
          collision
        });
        const ignoreOffer = !peer.__polite && collision;
        if (ignoreOffer) return;

        if (collision && peer.__polite) {
          await peer.setLocalDescription({ type: "rollback" });
        }
        await peer.setRemoteDescription(new RTCSessionDescription(data.description));

        if (myStream) addLocalTracks(peer, myStream);
        configureCodecPreferences(peer);

        const answer = await peer.createAnswer();
        logWebRtc(data.sender, "createAnswer.success", {
          signalingState: peer.signalingState
        });
        await peer.setLocalDescription(answer);
        logWebRtc(data.sender, "setLocalDescription.answer.success", {
          signalingState: peer.signalingState,
          localDescriptionType: peer.localDescription?.type
        });
        socket.emit("sdp", {
          description: peer.localDescription,
          to: data.sender,
          sender: socket.id
        });
      } else {
        if (peer.signalingState !== "have-local-offer") return;
        logWebRtc(data.sender, "setRemoteDescription.answer.start", {
          signalingState: peer.signalingState
        });
        await peer.setRemoteDescription(new RTCSessionDescription(data.description));
        logWebRtc(data.sender, "setRemoteDescription.answer.success", {
          signalingState: peer.signalingState,
          remoteDescriptionType: peer.remoteDescription?.type
        });
      }

      await flushPendingCandidates(data.sender, peer);
    });
  } catch (error) {
      logWebRtc(data.sender, "sdp.negotiation.rejected", {
        errorName: error?.name,
        errorMessage: error?.message
      });
      console.error("SDP negotiation rejected:", error);
  }
} );


//When the video mute icon is clicked

document.getElementById('toggle-video').addEventListener('click', (e) => {
  e.preventDefault();
  if (!myStream) return;
  const videoTrack = myStream.getVideoTracks()[0];
  if (!videoTrack) return;
  videoTrack.enabled = !videoTrack.enabled;
  document.getElementById('buttonVideo').className =
    videoTrack.enabled ? 'bi bi-camera-video-fill' : 'bi bi-camera-video-off-fill';
});


//When the audio mute icon is clicked
document.getElementById('toggle-mute').addEventListener('click', (e) => {
  e.preventDefault();
  if (!myStream) return;
  const audioTrack = myStream.getAudioTracks()[0];
  if (!audioTrack) return;
  audioTrack.enabled = !audioTrack.enabled;
  document.getElementById('buttonAudio').className =
    audioTrack.enabled ? 'bi bi-mic-fill' : 'bi bi-mic-mute-fill';
});

document.getElementById("enable-media").addEventListener("click", async (event) => {
  event.preventDefault();
  await enableLocalMedia();
});

document.getElementById("enable-playback").addEventListener("click", async (event) => {
  event.preventDefault();
  await enableRemotePlayback();
});

socket.on('user-disconnected', (userId, playernum) => {
  console.log('user disconnected', userId, playernum, typeof playernum)
  closePeerConnection(userId, true);
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
    this.marblesBySide = {
      top: [],
      right: [],
      bottom: [], 
      left: [],
    };

    Object.entries(MARBLE_LAYOUT).forEach(([side, cfg]) => {
      cfg.positions.forEach(pos => {
        const marble = playerMarble(this, pos.x, pos.y, 'sphere', cfg.color, pos.id);

        //Add metadata for later logic
        marble.side = side;  // "top", "right", "bottom", "left"
        marble.color = cfg.color; // "g", "b", "r", "y"
        marble.id = pos.id; // "t1", "t2", ..., "l5"

        this.marblesBySide[side].push(marble);
      });
    });

    const [t1, t2, t3, t4, t5] = this.marblesBySide.top;
    const [r1, r2, r3, r4, r5] = this.marblesBySide.right;
    const [b1, b2, b3, b4, b5] = this.marblesBySide.bottom;   
    const [l1, l2, l3, l4, l5] = this.marblesBySide.left;


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


    this.textMarker = this.add.image(0, 0, 'origin-marker')
      .setOrigin(0.5)
      .setDisplaySize(21, 21);
    this.textMarker.setDepth(1000);
    this.textMarker.setVisible(false);

    this.colorsturn = this.add.text(1025, 190, '', { color: 'white', fontSize: 'bold 30px', align: 'center' }).setOrigin(0.5)


    
    
    // ---- Player Ball lookup table   
    const playerBallLookup = {
      'top1': t1, 'top2': t2, 'top3': t3, 'top4': t4, 'top5': t5, 'left1': l1, 'left2': l2, 'left3': l3, 'left4': l4, 'left5': l5,
      'right1': r1, 'right2': r2, 'right3': r3, 'right4': r4, 'right5': r5, 'bottom1': b1, 'bottom2': b2, 'bottom3': b3, 'bottom4': b4, 'bottom5': b5
    }

    const keys = Object.keys(playerBallLookup)
    const marbleSnapshotBaseline = new Map(
      Object.entries(playerBallLookup).map(([name, marble]) => [
        name,
        { x: marble.x, y: marble.y }
      ])
    )
    let marbleSnapshotSequence = 0

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

    socket.on("marbleStateDelta", (delta) => {
      if (!delta || !Array.isArray(delta.changes)) return;
      if (!Number.isInteger(delta.sequence) || delta.sequence <= marbleSnapshotSequence) return;
      marbleSnapshotSequence = delta.sequence;
      for (const change of delta.changes) {
        if (!change || typeof change.name !== "string") continue;
        const marble = playerBallLookup[change.name];
        if (!marble || !Number.isFinite(change.x) || !Number.isFinite(change.y)) continue;
        marble.x = change.x;
        marble.y = change.y;
        marbleSnapshotBaseline.set(change.name, { x: change.x, y: change.y });
      }
      if (typeof delta.turn === "string") this.colorsturn.text = delta.turn;
      if (typeof delta.reset === "boolean") this.resetGame.setVisible(delta.reset);
    });

    socket.on("marker", (posX, posY) => {
      const sourceHole = getNearestBoardHole(gameBoard, posX, posY);
      this.textMarker.setPosition(
        sourceHole ? sourceHole.x : posX,
        sourceHole ? sourceHole.y : posY
      );
      this.textMarker.setVisible(true);
      this.children.bringToTop(this.textMarker);
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
    this.textMarker.setVisible(false)
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
      for (const card of playershand) card.destroy();
      for (const card of cards_in_dropZone) card.destroy();
      playershand = []
      cards_in_dropZone = []

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
        for (const [name, marble] of Object.entries(playerBallLookup)) {
          marbleSnapshotBaseline.set(name, { x: marble.x, y: marble.y });
        }
      }
    // redisplay players hand
      if(cardhand.length !== 0){
        for (let i = 0; i < cardhand.length; i++) {
          let playerCard = new Card(this);
          let obj = playerCard.render(900 + (i * 50), 680, 'cards', cardhand[i]).setDepth(i)
          obj.name = cardhand[i]
          playershand.push(obj)
        } 
        this.resetGame.setVisible(false)
      }
    
    // redisplay DropZone card
      if(lastcardplayed && lastcardplayed.length !== 0){
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
        const sourceX = gameObject.input.dragStartX ?? gameObject.x;
        const sourceY = gameObject.input.dragStartY ?? gameObject.y;
        const sourceHole = getNearestBoardHole(
          gameBoard,
          sourceX,
          sourceY
        );
        const markerX = sourceHole ? sourceHole.x : sourceX;
        const markerY = sourceHole ? sourceHole.y : sourceY;

        this.textMarker.setPosition(markerX, markerY);
        this.textMarker.setVisible(true);
        this.children.bringToTop(this.textMarker);
        socket.emit('markerclient', markerX, markerY)
      }
     });

    this.input.on("dragend", (pointer, gameObject, dropped) => {
      if (keys.includes(gameObject.name)) {
        const finalPosition = {
          name: gameObject.name,
          x: gameObject.x,
          y: gameObject.y
        };
        socket.emit("objMoveData", finalPosition);
        lastSentMarblePosition = finalPosition;
        lastMovementSentAt = performance.now();
      }

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
          const changes = [];
          for (const [name, marble] of Object.entries(playerBallLookup)) {
            const baseline = marbleSnapshotBaseline.get(name);
            if (!baseline || Math.abs(baseline.x - marble.x) > 0.01 || Math.abs(baseline.y - marble.y) > 0.01) {
              changes.push({ name, x: marble.x, y: marble.y });
            }
          }
          marbleSnapshotSequence++;
          for (const change of changes) {
            marbleSnapshotBaseline.set(change.name, { x: change.x, y: change.y });
          }
          socket.emit('marbleState', {
            sequence: marbleSnapshotSequence,
            changes,
            turn: this.colorsturn.text,
            reset: newGameButtonStatus
          })
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
        const now = performance.now();
        if (now - lastMovementSentAt >= movementIntervalMs) {
          lastSentMarblePosition = {
            name: gameObject.name,
            x: gameObject.x,
            y: gameObject.y
          };
          socket.volatile.emit("objMoveData", lastSentMarblePosition);
          lastMovementSentAt = now;
        }
      }
    });


// -- function section --


    let snapMarble = (obj, groupObj) => {
      this.gameObject = obj
      this.children.bringToTop(this.gameObject)
      this.gameObject.x = groupObj.x
      this.gameObject.y = groupObj.y
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
    }

    function move_opponets_Marble(item) {
        item.x = item.getData('X')
        item.y = item.getData('Y')
    }


    function playerStart(pos, obj) {
        obj.x = pos.x
        obj.y = pos.y
        pos.x = pos.getData('X')
        pos.y = pos.getData('Y')
    }

    function playerHome(pos, obj) {
        obj.x = pos.x
        obj.y = pos.y
        pos.x = pos.getData('homeX')
        pos.y = pos.getData('homeY')
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

function setMediaStatus(message, isError = false) {
  const status = document.getElementById("media-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function getMediaErrorMessage(error) {
  if (!h.userMediaAvailable()) {
    return "Camera and microphone capture is unavailable in this browser.";
  }
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return "Camera and microphone permission was denied. Allow access in browser settings, then try again.";
  }
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No camera or microphone was found.";
  }
  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "The camera or microphone is already in use or could not be started.";
  }
  return error?.message ? `Could not start camera and microphone: ${error.message}` : "Could not start camera and microphone.";
}

async function enableLocalMedia() {
  const button = document.getElementById("enable-media");
  if (button) {
    button.disabled = true;
    button.textContent = "Enabling...";
  }
  try {
    const stream = await ensureUserStream();
    for (const [partnerName, peer] of Object.entries(pc)) {
      if (!isPeerCurrent(pc, partnerName, peer)) continue;
      addLocalTracks(peer, stream);
      peer.__mediaRenegotiationNeeded = true;
      peer.__sendOffer?.(true);
    }
    setMediaStatus("Camera and microphone enabled.");
    if (button) button.textContent = "Camera and microphone enabled";
  } catch (error) {
    console.error("Local media capture rejected:", error);
    setMediaStatus(getMediaErrorMessage(error), true);
    if (button) {
      button.disabled = false;
      button.textContent = "Try enabling camera and microphone again";
    }
  }
}

async function enableRemotePlayback() {
  let attempted = 0;
  for (const video of document.querySelectorAll(".remote-video video")) {
    try {
      await video.play();
      attempted++;
    } catch (error) {
      console.warn("Remote playback rejected:", error);
    }
  }
  const button = document.getElementById("enable-playback");
  if (attempted > 0 && button) button.hidden = true;
}

 const webrtcDebugLog = [];
 function logWebRtc(peerId, event, detail = {}) {
   const entry = { timestamp: Date.now(), peerId, event, ...detail };
   webrtcDebugLog.push(entry);
   if (webrtcDebugLog.length > 200) webrtcDebugLog.shift();
   window.__jokerWebRtcDebug = webrtcDebugLog;
   console.debug("[WebRTC]", entry);
 }

 function ensureUserStream() {
  if (myStream) return Promise.resolve(myStream);
  if (!mediaStreamPromise) {
    mediaStreamPromise = h.getUserFullMedia().then((stream) => {
      myStream = stream;
      h.setLocalStream(stream);
      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (track.kind === "video") {
            document.getElementById("buttonVideo").className = "bi bi-camera-video-off-fill";
            h.toggleVideoBtnDisabled(false);
          }
          if (track.kind === "audio") {
            document.getElementById("buttonAudio").className = "bi bi-mic-mute-fill";
          }
        }, { once: true });
      });
      return stream;
    }).catch((error) => {
      mediaStreamPromise = null;
      throw error;
    });
  }
  return mediaStreamPromise;
 }

 function closePeerConnection(partnerName, removeVideo = true) {
   const timer = peerRecoveryTimers.get(partnerName);
   if (timer) {
     clearTimeout(timer);
     peerRecoveryTimers.delete(partnerName);
  }

   const peer = pc[partnerName];
   if (peer) {
     peer.onicecandidate = null;
     peer.onnegotiationneeded = null;
     peer.oniceconnectionstatechange = null;
     peer.onicegatheringstatechange = null;
     peer.ontrack = null;
     peer.onconnectionstatechange = null;
     peer.onsignalingstatechange = null;
     if (typeof peer.close === "function") peer.close();
     delete pc[partnerName];
   }

   peerGenerations.set(partnerName, (peerGenerations.get(partnerName) || 0) + 1);
   peerInitPromises.delete(partnerName);
   signalingQueues.delete(partnerName);
   candidateQueues.delete(partnerName);
   const remoteStream = remoteStreams.get(partnerName);
   if (remoteStream?.getTracks) {
     remoteStream.getTracks().forEach((track) => track.stop());
   }
   remoteStreams.delete(partnerName);
   if (removeVideo) h.closeVideo(`${partnerName}-video`);
 }

  function requestIceServerConfig(timeoutMs = 4000) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve({ iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] });
      }, timeoutMs);
      socket.emit("getIceServer_Info", (ice) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(validateIceServerConfig(ice));
      });
    });
  }

  function reconcilePeerConnections(users) {
    if (!Array.isArray(users) || !socket.id) return;

    for (const user of users) {
      if (!user || typeof user.id !== "string" || user.id === socket.id) continue;
      if (user.connected === false) continue;

      const peer = pc[user.id];
      if (peer && ["connected", "connecting"].includes(peer.connectionState || peer.iceConnectionState)) continue;
      if (peer && peer.signalingState !== "closed") continue;

      init(shouldCreateOffer(socket.id, user.id), user.id);
    }
  }

  async function collectWebRtcStats() {
    const metrics = {
      collectedAt: Date.now(),
      connections: {}
    };
    for (const [partnerName, peer] of Object.entries(pc)) {
      const connection = {
        connectionState: peer.connectionState || "unknown",
        iceConnectionState: peer.iceConnectionState || "unknown",
        signalingState: peer.signalingState || "unknown",
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        currentRoundTripTime: null
      };
      if (typeof peer.getStats === "function") {
        try {
          const stats = await peer.getStats();
          stats.forEach((report) => {
            if (report.type === "inbound-rtp") {
              connection.bytesReceived += report.bytesReceived || 0;
              connection.packetsLost += report.packetsLost || 0;
            } else if (report.type === "outbound-rtp") {
              connection.bytesSent += report.bytesSent || 0;
            } else if (report.type === "candidate-pair" && report.state === "succeeded") {
              connection.currentRoundTripTime = report.currentRoundTripTime ?? null;
            }
          });
        } catch (error) {
          console.error("WebRTC stats unavailable:", error);
        }
      }
      metrics.connections[partnerName] = connection;
    }
    window.__jokerWebRtcMetrics = metrics;
  }

  function startWebRtcMetrics() {
    if (webrtcStatsInterval) return;
    collectWebRtcStats();
    webrtcStatsInterval = setInterval(collectWebRtcStats, 30000);
  }

  async function flushPendingCandidates(partnerName, peer) {
    const queue = candidateQueues.get(partnerName);
    if (!queue || !peer?.remoteDescription) return;
    for (const candidate of queue.drain()) {
      if (!isPeerCurrent(pc, partnerName, peer)) return;
      await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) => {
        console.error("ICE candidate rejected:", error);
      });
    }
  }

  window.addEventListener("pagehide", () => {
    for (const partnerName of Object.keys(pc)) {
      closePeerConnection(partnerName, true);
    }
    h.stopStream(myStream);
    myStream = "";
    mediaStreamPromise = null;
  });

  async function init( createOffer, partnerName ) {
   console.log("init- create offer",partnerName)
   if (pc[partnerName] && ["connected", "connecting", "new"].includes(pc[partnerName].connectionState)) {
     return;
   }
   if (peerInitPromises.has(partnerName)) return peerInitPromises.get(partnerName);

   const generation = peerGenerations.get(partnerName) || 0;
   const initPromise = (async () => {
     const ice = await requestIceServerConfig();
     if ((peerGenerations.get(partnerName) || 0) !== generation ||
         pc[partnerName]) return;

     const peer = new RTCPeerConnection(ice);
     pc[partnerName] = peer;
     peer.__shouldOffer = shouldCreateOffer(socket.id, partnerName);
     peer.__polite = socket.id.localeCompare(partnerName) > 0;
     peer.__offerPending = false;
     peer.__generation = generation;
     peer.oniceconnectionstatechange = () => {
       logWebRtc(partnerName, "iceconnectionstatechange", {
         iceConnectionState: peer.iceConnectionState,
         connectionState: peer.connectionState
       });
     };
     peer.onicegatheringstatechange = () => {
       logWebRtc(partnerName, "icegatheringstatechange", {
         iceGatheringState: peer.iceGatheringState
       });
     };
     peer.onicecandidate = ({ candidate }) => {
       if (!isPeerCurrent(pc, partnerName, peer)) return;
       logWebRtc(partnerName, candidate ? "icecandidate.generated" : "icecandidate.gathering.complete", {
         candidateType: candidate ? candidate.type : undefined,
         sdpMid: candidate?.sdpMid,
         sdpMLineIndex: candidate?.sdpMLineIndex
       });
       socket.emit("ice candidates", { candidate, to: partnerName, sender: socket.id });
     };
     peer.ontrack = (event) => {
       if (!isPeerCurrent(pc, partnerName, peer)) return;
       logWebRtc(partnerName, "ontrack", {
         trackKind: event.track?.kind,
         trackId: event.track?.id,
         streams: event.streams?.length || 0,
         muted: event.track?.muted,
         readyState: event.track?.readyState
       });
       let remoteStream = remoteStreams.get(partnerName) || event.streams?.[0] || new MediaStream();
       if (!remoteStreams.has(partnerName)) remoteStreams.set(partnerName, remoteStream);
       if (event.track && !remoteStream.getTracks().includes(event.track)) {
         remoteStream.addTrack(event.track);
       }

       let video = document.getElementById(`${partnerName}-video`);
       if (!video) {
         video = document.createElement("video");
         video.id = `${partnerName}-video`;
         video.autoplay = true;
         video.playsInline = true;
         video.className = "remote-video";
         video.disablePictureInPicture = true;
         document.getElementById("videos").appendChild(video);
       }
       video.srcObject = remoteStream;
       video.play?.().catch((error) => {
         if (error?.name !== "AbortError") console.warn("Remote video autoplay blocked:", error);
         const playbackButton = document.getElementById("enable-playback");
         if (playbackButton) playbackButton.hidden = false;
       });
       event.track?.addEventListener?.("ended", () => {
         if (!isPeerCurrent(pc, partnerName, peer)) return;
         if (!remoteStream.getTracks().includes(event.track)) return;
         remoteStream.removeTrack(event.track);
         const remainingVideo = remoteStream.getVideoTracks().length;
         if (!remainingVideo) h.closeVideo(`${partnerName}-video`);
         else video.srcObject = remoteStream;
       }, { once: true });
     };
     peer.onconnectionstatechange = () => {
       if (!isPeerCurrent(pc, partnerName, peer)) return;
       logWebRtc(partnerName, "connectionstatechange", {
         connectionState: peer.connectionState,
         iceConnectionState: peer.iceConnectionState,
         signalingState: peer.signalingState
       });

       switch (peer.connectionState || peer.iceConnectionState) {
         case "connected":
           const existingTimer = peerRecoveryTimers.get(partnerName);
           if (existingTimer) {
             clearTimeout(existingTimer);
             peerRecoveryTimers.delete(partnerName);
           }
           startWebRtcMetrics();
           break;
         case "disconnected":
           if (peerRecoveryTimers.has(partnerName)) break;
           peerRecoveryTimers.set(partnerName, setTimeout(() => {
             if (!isPeerCurrent(pc, partnerName, peer)) return;
             if (typeof peer.restartIce === "function") peer.restartIce();
             peerRecoveryTimers.set(partnerName, setTimeout(async () => {
               if (!isPeerCurrent(pc, partnerName, peer)) return;
               if (peer.connectionState === "connected") return;
               const shouldOffer = peer.__shouldOffer === true;
               closePeerConnection(partnerName, true);
               await init(shouldOffer, partnerName);
             }, 15000));
           }, 5000));
           break;
         case "failed":
           if (peerRecoveryTimers.has(partnerName)) break;
           peerRecoveryTimers.set(partnerName, setTimeout(async () => {
             if (!isPeerCurrent(pc, partnerName, peer)) return;
             const shouldOffer = peer.__shouldOffer === true;
             closePeerConnection(partnerName, true);
             await init(shouldOffer, partnerName);
           }, 2000));
           break;
         case "closed":
           closePeerConnection(partnerName, true);
           break;
       }
     };
     peer.onsignalingstatechange = () => {
       if (!isPeerCurrent(pc, partnerName, peer)) return;
       logWebRtc(partnerName, "signalingstatechange", {
         signalingState: peer.signalingState
       });
       if (peer.signalingState === "stable" &&
           peer.__mediaRenegotiationNeeded &&
           !peer.__offerPending) {
         peer.__mediaRenegotiationNeeded = false;
         peer.__sendOffer?.(true);
       }
       if (peer.signalingState === "closed") closePeerConnection(partnerName, true);
     };

     configureCodecPreferences(peer);

     const sendOffer = async (force = false) => {
       if (!isPeerCurrent(pc, partnerName, peer) ||
           (!force && !canCreateOffer(peer))) return;
       if (force && (
         peer.signalingState !== "stable" ||
         peer.__offerPending
       )) return;
         if (force) peer.__mediaRenegotiationNeeded = false;
         peer.__offerPending = true;
       const operations = signalingQueues.get(partnerName) || new SerializedOperations();
       signalingQueues.set(partnerName, operations);
       await operations.run(async () => {
         if (!isPeerCurrent(pc, partnerName, peer) || peer.signalingState !== "stable") return;
         configureCodecPreferences(peer);
         const offer = await peer.createOffer();
         logWebRtc(partnerName, "createOffer.success", {
           signalingState: peer.signalingState,
           offerMLineCount: (offer.sdp?.match(/^m=/gm) || []).length
         });
         await peer.setLocalDescription(offer);
         logWebRtc(partnerName, "setLocalDescription.offer.success", {
           signalingState: peer.signalingState,
           localDescriptionType: peer.localDescription?.type,
           iceGatheringState: peer.iceGatheringState
         });
         if (!isPeerCurrent(pc, partnerName, peer)) return;
         socket.emit("sdp", {
           description: peer.localDescription,
           to: partnerName,
           sender: socket.id
         });
       }).catch((error) => console.error("Offer creation rejected:", error))
         .finally(() => {
           if (isPeerCurrent(pc, partnerName, peer)) peer.__offerPending = false;
         });
     };

     peer.onnegotiationneeded = () => {
       if (peer.__shouldOffer === true && peer.signalingState === "stable") sendOffer();
     };
     peer.__sendOffer = sendOffer;

     if (myStream && peer.__shouldOffer) await sendOffer();
   })();

   peerInitPromises.set(partnerName, initPromise);
   try {
     await initPromise;
   } finally {
     if (peerInitPromises.get(partnerName) === initPromise) peerInitPromises.delete(partnerName);
   }
}  // end of function

//============================================
    
  } // --- end of PHASER CREATE function

  shutdown() {
    for (const peer of Object.values(pc)) {
      if (peer && typeof peer.close === "function") peer.close();
    }
    for (const partnerName of Object.keys(pc)) {
      h.closeVideo(`${partnerName}-video`);
    }
    for (const timer of peerRecoveryTimers.values()) clearTimeout(timer);
    peerRecoveryTimers.clear();
    pc = {};
    peerInitPromises.clear();
    signalingQueues.clear();
    candidateQueues.clear();
    remoteStreams.forEach((stream) => {
      stream?.getTracks?.().forEach((track) => track.stop());
    });
    remoteStreams.clear();
    peerGenerations.clear();
    if (webrtcStatsInterval) {
      clearInterval(webrtcStatsInterval);
      webrtcStatsInterval = null;
    }
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }
    socket.disconnect();
  }

  update() { }
}