import 'dotenv/config'
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import { createHands, isAlphanumeric } from "./src/helpers/gameutils.js";
import { RoomGameStore } from "./src/helpers/serverstate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});
const PORT = process.env.PORT || 5056;

app.use(express.static(path.join(__dirname, "/")));

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

const store = new RoomGameStore();

io.on("connection", (socket) => {
  socket.on("joinServer", (data) => {
    let roomName = data.roomName
    let userName = data.userName
    let playerNum = data.playerNum
    let socketID = data.socketId
    const passed = isAlphanumeric(roomName) && isAlphanumeric(userName)
    if (!passed) return;

    socket.join(roomName);
    socket.join(socketID)

    const reconnectedUser = store.reconnectUser(roomName, userName, socket.id);
    if (reconnectedUser) {
      playerNum = reconnectedUser.playernum;
    }
    
    if (getClientCount(roomName) > 1 && getClientCount(roomName) <= 4 ){
      socket.to(roomName).emit('new user', {socketId: data.socketId});
    }
    
    if (getClientCount(roomName) > 4){
      store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '5',})
      io.to(socket.id).emit('playerWarning')
    } else if (!reconnectedUser && (playerNum === '1' || playerNum === '2' || playerNum === '3' || playerNum === '4')) {
      store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: playerNum, })
    } else if (!reconnectedUser && !store.hasPlayerInRoom('1', roomName)){
      store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '1', });
    } else if (!reconnectedUser && !store.hasPlayerInRoom('2', roomName)) {
      store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '2',  });
    } else if (!reconnectedUser && !store.hasPlayerInRoom('3', roomName)) {
      store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '3', });
    } else if (!reconnectedUser && !store.hasPlayerInRoom('4', roomName)) {
      store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '4', });
    }
    
     // -------------WebRTC stuff ---------------------

      socket.on( 'newUserStart', ( data ) => {
        console.log('new user joins:', data.sender, data.to)
          socket.to( data.to ).emit( 'newUserStart', { sender: data.sender } );
      } );

      socket.on( 'sdp', ( data ) => {
          socket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
      } );

      socket.on( 'ice candidates', ( data ) => {
        console.log('Sending ice candidates to', data.to)
          socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
      } );

      socket.on('getIceServer_Info', () => {
          socket.emit('iceserver', iceServer)
      })
  
      

      // ************ END OF WEBRTC Stuff  ********************

    // ---- This is were the game recovery stuff would go
    
    const gamestatusupdate = store.getMarbleStates(roomName);
    const cardState = store.getCardState(roomName);
    let hand = []
    let lastcard = []
    if (cardState) {
      const handByPlayer = {
        1: cardState.hand1,
        2: cardState.hand2,
        3: cardState.hand3,
        4: cardState.hand4
      };
      hand = handByPlayer[playerNum] || [];
      lastcard = cardState.lastCardPlayed ?? "";
    }
    //console.log('filtered game status', socket.id)
    io.to(socket.id).emit("updateGameState", gamestatusupdate, hand, lastcard);
    io.to(roomName).emit("connectToRoom", store.getUsersInRoom(roomName));
    
    socket.on("objMoveData", (obj) => {
      //console.log("moving",obj.x)
       socket.to(roomName).emit("moveObject", obj)
    });

    socket.on('markerclient', (posX, posY) => {
      socket.to(roomName).emit("marker", posX, posY)
    })

    socket.on('closeModal', () => {
      socket.to(roomName).emit('closeModalBox')
    })

    socket.on("snapMarbleclient", (obj) => {
        socket.to(roomName).emit("snapMarbleServer", obj)
    });

    socket.on('winner', (data) => {
      console.log('winner', data)
      io.in(roomName).emit('winners', data)
    })

    socket.on('nameUpdate', (data, id, playernum) =>{
      if (store.updateUserName(id, data)) {
        socket.to(roomName).emit('updateName', data, playernum)
      }
    })

    socket.on('colourturnclient', (data) => {
    //console.log('color turn client', data)
    socket.to(roomName).emit('colourturn', data)
    })


    socket.on('player', (obj) => {
        //console.log('***** player ****', obj)
        socket.to(roomName).emit('otherplayer', obj)
    })

    socket.on('dealCardsclient', () => {
       const guests = store.getUsersInRoom(roomName);
       if(guests.length !== 4){
        console.log("number of players not equal to 4")
        io.to(socket.id).emit('alertmsg')
       } else {
          io.to(roomName).emit('startNewGame')  // clear cards from board
          const {hand1, hand2, hand3, hand4, gameDeck, cardsplayed} = createHands()
          store.setCardState({roomName, hand1, hand2, hand3, hand4, gameDeck, cardsplayed})

           const handsByPlayer = {1: hand1, 2: hand2, 3: hand3, 4: hand4};
           for (const guest of guests) {
             const hand = handsByPlayer[guest.playernum];
             if (hand) io.to(guest.id).emit('cards', hand);
           }

       }
        
  })

  socket.on('cardPlayedclient', function (gameObj, board, pos) {
    io.in(roomName).emit('cardPlayed', gameObj)
    const newCard = store.playCard(roomName, gameObj, board, pos);
    if (newCard !== null) {
      io.to(socket.id).emit('newcard', newCard, pos)
  } // end of roomcarddata !== -1
   // console.log('show game deck -- end', hand1, hand2)
    
})

  });  // end of room connection

  socket.on("marbleState", (gamestatus) => {
    //console.log("marblestate--->>>  ", marblestate)
    store.updateMarbleState(gamestatus)
    //console.log('marblestate:', marblestate)
  });

  socket.on("disconnect", function () {
    console.log("User disconnected " + socket.id);
    const playerinfo = store.disconnectUser(socket.id)
    if (!playerinfo) return;

    const playersInRoom = store.getUsersInRoom(playerinfo.gameName)
    if(playersInRoom.length > 0){
      io.in(playerinfo.gameName).emit('connectToRoom', playersInRoom)
      //console.log("remaining player", playersInRoom)
      io.in(playerinfo.gameName).emit( 'user-disconnected', socket.id, playerinfo.playernum)
    }
      
  });
});
// ----- FUNCTION Section -----------

const iceServer = {
      iceServers: [
          {
              urls: ["stun:us-turn12.xirsys.com"]
          },
          {
              username: process.env.USERID,
              credential: process.env.CRED,
              urls: [
                  "turn:us-turn12.xirsys.com:80?transport=udp",
                  "turn:us-turn12.xirsys.com:3478?transport=udp",
                  "turn:us-turn12.xirsys.com:80?transport=tcp",
                  "turn:us-turn12.xirsys.com:3478?transport=tcp",
                  "turns:us-turn12.xirsys.com:443?transport=tcp",
                  "turns:us-turn12.xirsys.com:5349?transport=tcp"

              ]
          }
      ]
  };



function getClientCount(roomName) {
  const room = io.sockets.adapter.rooms.get(roomName);
  if (room) {
    return room.size;
  }
  return 0;
}
