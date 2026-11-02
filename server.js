import 'dotenv/config'
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import crypto from "crypto";
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
const socketLimits = new Map();

function checkLimit(socket, event, limit = 30, windowMs = 1000) {
  const now = Date.now();
  const key = `${socket.id}:${event}`;
  const current = socketLimits.get(key) || { count: 0, resetAt: now + windowMs };
  if (now >= current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count++;
  socketLimits.set(key, current);
  if (current.count > limit) return false;
  return true;
}

function getSessionUser(socket, roomName) {
  if (!roomName) return undefined;
  return store.getUserById(socket.id) || store.getUsersInRoom(roomName)
    .find((user) => user.id === socket.id);
}

function isValidGameObject(value) {
  return value && typeof value === "object" &&
    typeof value.name === "string" &&
    Number.isFinite(value.x) && Number.isFinite(value.y);
}

io.on("connection", (socket) => {
  socket.on("joinServer", (data) => {
    if (!checkLimit(socket, "joinServer", 5, 10_000)) return;
    if (!data || typeof data !== "object") return;
    let roomName = data.roomName;
    let userName = data.userName;
    const sessionToken = data.sessionToken;
    const passed = isAlphanumeric(roomName) && isAlphanumeric(userName)
    if (!passed) return;
    if (
      socket.__jokerRoomName === roomName &&
      socket.__jokerHandlersRegistered
    ) return;

    socket.join(roomName);
    socket.join(socket.id);

    const reconnectedUser = store.reconnectUser(
      roomName,
      userName,
      socket.id,
      typeof sessionToken === "string" ? sessionToken : undefined
    );

    let joinedUser;
    if (getClientCount(roomName) > 4) {
      socket.leave(roomName);
      socket.emit('playerWarning');
      return;
    } else if (!reconnectedUser && !store.hasPlayerInRoom('1', roomName)){
      joinedUser = store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '1', sessionToken: crypto.randomBytes(32).toString("hex") });
    } else if (!reconnectedUser && !store.hasPlayerInRoom('2', roomName)) {
      joinedUser = store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '2', sessionToken: crypto.randomBytes(32).toString("hex") });
    } else if (!reconnectedUser && !store.hasPlayerInRoom('3', roomName)) {
      joinedUser = store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '3', sessionToken: crypto.randomBytes(32).toString("hex") });
    } else if (!reconnectedUser && !store.hasPlayerInRoom('4', roomName)) {
      joinedUser = store.addUser({ gameName: roomName, player: userName, id: socket.id, playernum: '4', sessionToken: crypto.randomBytes(32).toString("hex") });
    }

    const sessionUser = reconnectedUser || joinedUser;
    if (!sessionUser) {
      socket.leave(roomName);
      socket.emit('playerWarning');
      return;
    }
    socket.__jokerRoomName = roomName;
    socket.__jokerHandlersRegistered = true;
    const playerNum = sessionUser.playernum;
    socket.emit("session", { playerNum, sessionToken: sessionUser.sessionToken });

    if (getClientCount(roomName) > 1) {
      socket.to(roomName).emit('new user', {socketId: socket.id});
    }

     // -------------WebRTC stuff ---------------------

      socket.on( 'newUserStart', ( data ) => {
        if (!data || typeof data.to !== "string" || !getSessionUser(socket, roomName)) return;
        const recipient = store.getUserById(data.to);
        if (recipient && recipient.gameName === roomName && recipient.connected !== false) {
          socket.to(data.to).emit('newUserStart', { sender: socket.id });
        }
      } );

      socket.on( 'sdp', ( data ) => {
        if (!checkLimit(socket, "sdp", 20, 1000) || !data || typeof data.to !== "string" || !data.description) return;
        const recipient = store.getUserById(data.to);
        if (recipient && recipient.gameName === roomName) {
          socket.to(data.to).emit('sdp', { description: data.description, sender: socket.id });
        }
      } );

      socket.on( 'ice candidates', ( data ) => {
        if (!checkLimit(socket, "ice", 100, 1000) || !data || typeof data.to !== "string") return;
        const recipient = store.getUserById(data.to);
        if (recipient && recipient.gameName === roomName && "candidate" in data) {
          socket.to(data.to).emit('ice candidates', { candidate: data.candidate, sender: socket.id });
        }
      } );

      socket.on('getIceServer_Info', (ack) => {
        const member = getSessionUser(socket, roomName);
        if (!member) return typeof ack === "function" ? ack(null) : undefined;
        const config = createIceServer();
        if (typeof ack === "function") ack(config);
        else socket.emit('iceserver', config);
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
      if (!checkLimit(socket, "objMoveData", 60, 1000) || !isValidGameObject(obj)) return;
      socket.to(roomName).emit("moveObject", { name: obj.name, x: obj.x, y: obj.y });
    });

    socket.on('markerclient', (posX, posY) => {
      if (!checkLimit(socket, "marker", 20, 1000)) return;
      if (!Number.isFinite(posX) || !Number.isFinite(posY)) return;
      socket.to(roomName).emit("marker", posX, posY);
    })

    socket.on('closeModal', () => {
      socket.to(roomName).emit('closeModalBox')
    })

    socket.on("snapMarbleclient", (obj) => {
        if (!checkLimit(socket, "snap", 30, 1000) || !isValidGameObject(obj)) return;
        socket.to(roomName).emit("snapMarbleServer", { name: obj.name, x: obj.x, y: obj.y });
    });

    socket.on('winner', (data) => {
      if (data !== "gr" && data !== "yb") return;
      io.in(roomName).emit('winners', data)
    })

    socket.on('nameUpdate', (data) =>{
      if (!checkLimit(socket, "nameUpdate", 3, 10_000)) return;
      const member = store.getUserById(socket.id);
      if (!member || typeof data !== "string" || data.length > 30 || !/^[a-zA-Z0-9 ]+$/.test(data)) return;
      if (store.updateUserName(socket.id, data)) {
        socket.to(roomName).emit('updateName', data, member.playernum)
      }
    })

    socket.on('colourturnclient', (data) => {
      if (typeof data !== "string" || data.length > 120) return;
      socket.to(roomName).emit('colourturn', data)
    })


    socket.on('player', (obj) => {
        if (!checkLimit(socket, "player", 60, 1000) || !isValidGameObject(obj)) return;
        socket.to(roomName).emit('otherplayer', { name: obj.name, x: obj.x, y: obj.y });
    })

    socket.on('dealCardsclient', () => {
       const member = store.getUserById(socket.id);
       if (!member || member.playernum !== "1") return;
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
    if (typeof gameObj !== "string" || gameObj.length > 8 || !Number.isInteger(pos) || pos < 0 || pos >= 6) return;
    const member = store.getUserById(socket.id);
    if (!member || String(member.playernum) !== String(board)) return;
    const newCard = store.playCard(roomName, gameObj, board, pos);
    if (newCard !== null) {
      io.in(roomName).emit('cardPlayed', gameObj)
      io.to(socket.id).emit('newcard', newCard, pos)
  } // end of roomcarddata !== -1
   // console.log('show game deck -- end', hand1, hand2)
    
})

  });  // end of room connection

  socket.on("marbleState", (gamestatus) => {
    const member = store.getUserById(socket.id);
    if (!member || !Array.isArray(gamestatus)) return;
    if (gamestatus.length !== 23) return;
    const normalized = [member.gameName];
    for (let i = 1; i <= 20; i++) {
      const marble = gamestatus[i];
      if (!marble || !Number.isFinite(marble.x) || !Number.isFinite(marble.y)) return;
      normalized.push({ x: marble.x, y: marble.y });
    }
    normalized.push(
      typeof gamestatus[21] === "string" ? gamestatus[21].slice(0, 120) : "",
      Boolean(gamestatus[22])
    );
    store.updateMarbleState(normalized);
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

function createIceServer() {
  const iceServers = [
    { urls: ["stun:us-turn12.xirsys.com"] }
  ];

  if (process.env.TURN_URLS && process.env.TURN_SECRET) {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const username = `${expiresAt}:${crypto.randomBytes(8).toString("hex")}`;
    const credential = crypto.createHmac("sha1", process.env.TURN_SECRET)
      .update(username)
      .digest("base64");
    iceServers.push({
      username,
      credential,
      urls: process.env.TURN_URLS.split(",").map((url) => url.trim()).filter(Boolean)
    });
  }

  return { iceServers };
}



function getClientCount(roomName) {
  const room = io.sockets.adapter.rooms.get(roomName);
  if (room) {
    return room.size;
  }
  return 0;
}
