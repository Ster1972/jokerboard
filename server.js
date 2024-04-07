import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const options = {
  transports: ["websockets"],
  allowUpgrades: false,
  pingInterval: 30000,
  pingTimeout: 60000,
  cookie: false
}

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

let users = [];
let marblestate = [];
let cardstate = [];

io.on("connection", (socket) => {
  console.log("User connected..  ", socket.id);
  //console.log('socket connected', socket.connected, process.argv);

  socket.on("joinServer", (data) => {
    let roomName = data.roomName
    let userName = data.userName
    let playerNum = data.playerNum
    let socketID = data.socketId
    console.log('socket ID =====', data)
    let passed = checkforalphanumberic(roomName, userName)
    socket.join(roomName);
    socket.join(socketID)
    console.log("join server", roomName, userName, playerNum, passed, getClientCount(roomName), socketID)
    
   
    if (getClientCount(roomName) > 1 && getClientCount(roomName) <= 4 ){
      socket.to(roomName).emit('new user', {socketId: data.socketId});
    }
    if (getClientCount(roomName) > 4){
      console.log('too many players detected',getClientCount(roomName)  )
      users.push({ gameName: roomName, player: userName, id: socket.id, playernum: '5',})
      io.to(socket.id).emit('playerWarning')
  } else if (playerNum === '1' || playerNum === '2' || playerNum === '3' || playerNum === '4' ){
      users.push({ gameName: roomName, player: userName, id: socket.id, playernum: playerNum, })
    } 
    else if(!exist('1', roomName)){
      users.push({ gameName: roomName, player: userName, id: socket.id, playernum: '1', });
    } else if (!exist('2', roomName)) {
      users.push({ gameName: roomName, player: userName, id: socket.id, playernum: '2',  });
    } else if (!exist('3', roomName)) {
      users.push({ gameName: roomName, player: userName, id: socket.id, playernum: '3', });
    } else if (!exist('4', roomName)) {
      users.push({ gameName: roomName, player: userName, id: socket.id, playernum: '4', });
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
          socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
      } );

      // ************ END OF WEBRTC Stuff  ********************

    // ---- This is were the game recovery stuff would go
    
    let gamestatusupdate = marblestate.filter((function(e){return e[0] === roomName;}))
    let cardsupdate = cardstate.filter((function(e){return e.roomName === roomName}))
    let hand = []
    let lastcard = []
      // console.log('card update', cardsupdate)     
    if (cardsupdate.length > 0 && playerNum === '1'){
        hand = cardsupdate[0].hand1
        lastcard = cardsupdate[0].cardsplayed[cardsupdate[0].cardsplayed.length -1]
    } else
    if (cardsupdate.length > 0 && playerNum === '2'){
        hand = cardsupdate[0].hand2
        lastcard = cardsupdate[0].cardsplayed[cardsupdate[0].cardsplayed.length -1]
    } else
    if (cardsupdate.length > 0 && playerNum === '3'){
        hand = cardsupdate[0].hand3
        lastcard = cardsupdate[0].cardsplayed[cardsupdate[0].cardsplayed.length -1]
    } else
    if (cardsupdate.length > 0 && playerNum === '4'){
        hand = cardsupdate[0].hand4
        lastcard = cardsupdate[0].cardsplayed[cardsupdate[0].cardsplayed.length -1]
    }
    //console.log('filtered game status', socket.id)
    io.to(socket.id).emit("updateGameState", gamestatusupdate, hand, lastcard);
   // console.log('** Users **',users.filter((e) => e.gameName === roomName))
    console.log('exixt output', exist('' + playerNum, roomName))
    io.to(roomName).emit("connectToRoom", users.filter((e) => e.gameName === roomName));
    
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
      //console.log('nameUpdate', data, id)
      //console.log('user DB', users)
      //const info = users.filter((e) => e.id === socket.id) //get player info
      const index = users.findIndex((e) => e.id === id); //get index of user disconnected
      console.log('users data', index, users[index])
      users[index].player = data
      console.log('update data', users[index],roomName)
      socket.to(roomName).emit('updateName', data, playernum)
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
       let guests = users.filter((function(e){return e.gameName === roomName;}))
       if(guests.length !== 4){
        console.log("number of players not equal to 4")
        io.to(socket.id).emit('alertmsg')
       } else {
          const indexCardstate = cardstate.findIndex((e) => e.roomName === roomName)
          cardstate.splice(indexCardstate,1)
        
          io.to(roomName).emit('startNewGame')  // clear cards from board
          const {hand1, hand2, hand3, hand4, gameDeck, cardsplayed} = createHands()
          cardstate.push({roomName, hand1,hand2,hand3,hand4,gameDeck,cardsplayed})

           if (guests[0].playernum === '1'){
              io.to(guests[0].id).emit('cards', hand1)
           }
           if (guests[1].playernum === '2'){
              io.to(guests[1].id).emit('cards', hand2)
           }
           if (guests[2].playernum === '3'){
             io.to(guests[2].id).emit('cards', hand3)
           }
           if (guests[3].playernum === '4'){
             io.to(guests[3].id).emit('cards', hand4)
           }

       }
        
  })

  socket.on('cardPlayedclient', function (gameObj, board ,pos,sock) {
    let connection = [...socket.rooms]  // provides socket and room info of the current connections
    io.in(connection[1]).emit('cardPlayed', gameObj)  // send card played to other dropboxes
    let roomcarddata = cardstate.findIndex(element => {return element.roomName === connection[1]});
    if (roomcarddata !== -1) {
      let {hand1,hand2,hand3,hand4,gameDeck,cardsplayed} = cardstate[roomcarddata];
      cardsplayed.push(gameObj)  //remembers the cards that have been played
      let handdataset = { 1 : hand1, 2 : hand2, 3: hand3, 4: hand4}
      let handbeingplayed = handdataset[board]  // hand being played
      io.to(connection[0]).emit('newcard', gameDeck[0],pos)
      handbeingplayed.splice(pos,1)  //remove card from the hand being played
      handbeingplayed.splice(pos,0, gameDeck[0] )  //add new card to the hand from the top of deck)
      gameDeck.splice(0,1)  //remove card from game deck array
    
    //console.log("data found: ",hand1, hand2)
    if (gameDeck.length === 0 ){
        shuffle(cardsplayed)
        gameDeck.push(...cardsplayed)
        cardsplayed.length = 0
   
      }
  } // end of roomcarddata !== -1
   // console.log('show game deck -- end', hand1, hand2)
    
})

  });  // end of room connection

  socket.on("marbleState", (gamestatus) => {
    //console.log("marblestate--->>>  ", marblestate)
    let found = marblestate.map(function(e){return e[0];}).indexOf(gamestatus[0])
               //console.log('found', found)
               if (found < 0){
                marblestate.push(gamestatus)
               }
               marblestate.splice(found,1)
               marblestate.push(gamestatus)
    //console.log('marblestate:', marblestate)
  });

  socket.on("disconnect", function () {
    console.log("User disconnected " + socket.id);
    const playerinfo = users.filter((e) => e.id === socket.id) //get player info
    const index = users.findIndex((e) => e.id === socket.id); //get index of user disconnected
    users.splice(index, 1); //remove user

    console.log("disconnect info", playerinfo[0].playernum)

    const playersInRoom = users.filter((e) => e.gameName === playerinfo[0].gameName)
    if(playersInRoom.length === 0){
      const indexCardstate = cardstate.findIndex((e) => e.roomName === playerinfo[0].gameName)
      cardstate.splice(indexCardstate,1)
    }
    if(playersInRoom.length > 0){
      io.in(playerinfo[0].gameName).emit('connectToRoom', playersInRoom)
      //console.log("remaining player", playersInRoom)
      io.in(playerinfo[0].gameName).emit( 'user-disconnected', socket.id, playerinfo[0].playernum)
    }
      
  });
});
// ----- FUNCTION Section -----------

function checkforalphanumberic(rmName, userNam){
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(rmName) || !alphanumericRegex.test(userNam)) {
   return false  // An invalid character has been found
  } else
  return true

}

function exist(playerNum, room){
  let roomusers = users.filter((e) => e.gameName === room);
  let check = roomusers.some((user) => user.playernum === playerNum);
  return check
}

function getIceServer() {
        
  return {
      iceServers: [
          {
              urls: ["stun:us-turn12.xirsys.com"]
          },
          {
              username: process.env.LOGONID,
              credential: process.env.CREDENTIAL,
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
}

function getClientCount(roomName) {
  const room = io.sockets.adapter.rooms.get(roomName);
  if (room) {
    return room.size;
  }
  return 0;
}

function createHands() {

      let originalDeck = ['2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c', '4d', '4h', '4s', '5c', '5d', '5h', '5s',
      '6c', '6d', '6h', '6s', '7c', '7d', '7h', '7s', '8c', '8d', '8h', '8s','9c', '9d', '9h', '9s', '10c', '10d', '10h', '10s',
      'jc', 'jd', 'jh', 'js', 'qc', 'qd', 'qh', 'qs', 'kc', 'kd', 'kh', 'ks', 'ac', 'ad', 'ah', 'as', 'bj', 'rj',
      '22c', '22d', '22h', '22s', '33c', '33d', '33h', '33s', '44c', '44d', '44h', '44s', '55c', '55d', '55h', '55s',
      '66c', '66d', '66h', '66s', '77c', '77d', '77h', '77s', '88c', '88d', '88h', '88s', '99c', '99d', '99h', '99s', '110c', '110d', '110h', '110s',
      'jjc', 'jjd', 'jjh', 'jjs', 'qqc', 'qqd', 'qqh', 'qqs', 'kkc', 'kkd', 'kkh', 'kks', 'aac', 'aad', 'aah', 'aas', 'bbj', 'rrj'];

  shuffle(originalDeck);
  let gameDeck = [...originalDeck]
  let hand1 = [];
  let hand2 = [];
  let hand3 = [];
  let hand4 = [];
  let cardsplayed = [];
  for (var i = 0; i < 6; i++) {
      hand1.push(gameDeck[0]);
      gameDeck.shift();
      hand2.push(gameDeck[0]);
      gameDeck.shift();
      hand3.push(gameDeck[0]);
      gameDeck.shift();
      hand4.push(gameDeck[0]);
      gameDeck.shift();
  }
  return {hand1, hand2, hand3, hand4, gameDeck, cardsplayed};
}

function shuffle(arra1) {
  let ctr = arra1.length, temp, index;
  while (ctr > 0) {
      index = Math.floor(Math.random() * ctr);
      ctr--;
      temp = arra1[ctr];
      arra1[ctr] = arra1[index];
      arra1[index] = temp;
  }
  return arra1;
}
