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
import {
  TURN_CREDENTIAL_LIFETIME_SECONDS,
  getIceServerCacheLifetimeMs
} from "./src/helpers/icecredentials.js";

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
const marbleSnapshotSequences = new Map();
let iceServerCache = null;
let iceServerFetchPromise = null;

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

function clearSocketRateLimits(socketId) {
  for (const key of socketLimits.keys()) {
    if (key.startsWith(`${socketId}:`)) socketLimits.delete(key);
  }
}

function isValidSdpDescription(description) {
  if (!description || typeof description !== "object") return false;
  if (!["offer", "answer"].includes(description.type)) return false;
  return typeof description.sdp === "string" && description.sdp.length <= 64 * 1024;
}

function isValidIceCandidate(candidate) {
  if (candidate === null) return true;
  if (!candidate || typeof candidate !== "object") return false;
  if (typeof candidate.candidate !== "string" || candidate.candidate.length > 4096) return false;
  if (candidate.sdpMid !== undefined &&
      (typeof candidate.sdpMid !== "string" || candidate.sdpMid.length > 128)) return false;
  if (candidate.sdpMLineIndex !== undefined &&
      (!Number.isInteger(candidate.sdpMLineIndex) ||
       candidate.sdpMLineIndex < 0 ||
       candidate.sdpMLineIndex > 1024)) return false;
  return true;
}

function getValidTurnUrls(value) {
  if (typeof value !== "string") return [];
  return value.split(",")
    .map((url) => url.trim())
    .filter((url) => /^turns?:\/\//i.test(url) || /^stuns?:\/\//i.test(url));
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
        if (!checkLimit(socket, "sdp", 20, 1000) ||
            !data ||
            typeof data.to !== "string" ||
            !isValidSdpDescription(data.description)) return;
        const recipient = store.getUserById(data.to);
        if (recipient && recipient.gameName === roomName) {
          socket.to(data.to).emit('sdp', { description: data.description, sender: socket.id });
        }
      } );

      socket.on( 'ice candidates', ( data ) => {
        if (!checkLimit(socket, "ice", 100, 1000) || !data || typeof data.to !== "string") return;
        const recipient = store.getUserById(data.to);
        if (recipient && recipient.gameName === roomName && "candidate" in data &&
            isValidIceCandidate(data.candidate)) {
          socket.to(data.to).emit('ice candidates', { candidate: data.candidate, sender: socket.id });
        }
      } );

      socket.on('getIceServer_Info', (ack) => {
        const member = getSessionUser(socket, roomName);
        if (!member) return typeof ack === "function" ? ack(null) : undefined;
        createIceServer().then((config) => {
          if (typeof ack === "function") ack(config);
          else socket.emit('iceserver', config);
        }).catch(() => {
          const fallback = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };
          if (typeof ack === "function") ack(fallback);
          else socket.emit('iceserver', fallback);
        });
      });
  
      

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
    io.to(socket.id).emit(
      "updateGameState",
      gamestatusupdate,
      hand,
      lastcard,
      cardState?.activePlayer ?? null
    );
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


    socket.on('dealCardsclient', () => {
       const member = store.getUserById(socket.id);
       if (!member) return;
       if (!checkLimit(socket, "dealCards", 1, 1000)) return;
       const guests = store.getUsersInRoom(roomName);
       if(guests.length !== 4){
        console.log("number of players not equal to 4")
        io.to(socket.id).emit('alertmsg')
       } else {
          io.to(roomName).emit('startNewGame')  // clear cards from board
          const {hand1, hand2, hand3, hand4, gameDeck, cardsplayed} = createHands()
          store.setCardState({
            roomName,
            hand1,
            hand2,
            hand3,
            hand4,
            gameDeck,
            cardsplayed,
            activePlayer: 1,
            pendingCardPlayer: null,
            authoritative: true,
            seenActions: []
          })
          io.in(roomName).emit("activePlayer", 1);

           const handsByPlayer = {1: hand1, 2: hand2, 3: hand3, 4: hand4};
           for (const guest of guests) {
             const hand = handsByPlayer[guest.playernum];
             if (hand) io.to(guest.id).emit('cards', hand);
           }

       }
        
  })

  socket.on('cardPlayedclient', function (gameObj, board, pos, acknowledge) {
    const reject = (reason) => {
      if (typeof acknowledge === "function") acknowledge({ accepted: false, reason });
    };
    if (typeof gameObj !== "string" || gameObj.length > 8 || !Number.isInteger(pos) || pos < 0 || pos >= 6) {
      reject("invalid");
      return;
    }
    const member = store.getUserById(socket.id);
    if (!member || String(member.playernum) !== String(board)) {
      reject("invalid");
      return;
    }
    const newCard = store.playCard(roomName, gameObj, board, pos);
    if (newCard === null) {
      const cardState = store.getCardState(roomName);
      reject(cardState?.activePlayer !== Number(member.playernum) ? "turn" : "invalid");
      return;
    }
    const cardState = store.getCardState(roomName);
    io.in(roomName).emit('cardPlayed', gameObj)
    io.to(socket.id).emit('newcard', newCard, pos)
    if (cardState?.pendingActionId) {
      io.to(socket.id).emit('cardActionId', cardState.pendingActionId)
    }
    if (typeof acknowledge === "function") acknowledge({ accepted: true });
   // console.log('show game deck -- end', hand1, hand2)
    
})

  });  // end of room connection

  socket.on("marbleState", (gamestatus) => {
    const member = store.getUserById(socket.id);
    if (!member || !gamestatus || typeof gamestatus !== "object") return;
    if (!checkLimit(socket, "marbleState", 30, 1000)) return;
    if (!Array.isArray(gamestatus.changes) || gamestatus.changes.length > 20) return;

    const validNames = new Set([
      "top1", "top2", "top3", "top4", "top5",
      "right1", "right2", "right3", "right4", "right5",
      "bottom1", "bottom2", "bottom3", "bottom4", "bottom5",
      "left1", "left2", "left3", "left4", "left5"
    ]);
    const changes = [];
    for (const change of gamestatus.changes) {
      if (!change || !validNames.has(change.name)) return;
      if (!Number.isFinite(change.x) || !Number.isFinite(change.y)) return;
      if (Math.abs(change.x) > 2000 || Math.abs(change.y) > 2000) return;
      changes.push({ name: change.name, x: change.x, y: change.y });
    }

    const cardState = store.getCardState(member.gameName);
    const playerNum = Number(member.playernum);
    const pendingActionId = typeof gamestatus.actionId === "string" && gamestatus.actionId.length > 0
      ? gamestatus.actionId
      : (cardState && cardState.pendingCardPlayer === playerNum ? cardState.pendingActionId : null);
    if (pendingActionId && cardState && cardState.pendingCardPlayer === playerNum) {
      const completedAction = store.completeMarbleAction(
        member.gameName,
        playerNum,
        pendingActionId,
        changes
      );
      if (completedAction) {
        io.in(member.gameName).emit("activePlayer", completedAction.activePlayer);
      }
    }

    const turn = typeof gamestatus.turn === "string" ? gamestatus.turn.slice(0, 120) : "";
    const reset = Boolean(gamestatus.reset);
    store.updateMarbleDelta(member.gameName, changes, turn, reset);

    const nextSequence = (marbleSnapshotSequences.get(member.gameName) || 0) + 1;
    marbleSnapshotSequences.set(member.gameName, nextSequence);
    socket.to(member.gameName).emit("marbleStateDelta", {
      sequence: nextSequence,
      changes,
      turn,
      reset
    });
  });

  socket.on("disconnect", function () {
    console.log("User disconnected " + socket.id);
    clearSocketRateLimits(socket.id);
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

async function createIceServer() {
  if (iceServerCache && iceServerCache.expiresAt > Date.now()) {
    return { iceServers: iceServerCache.iceServers };
  }

  const iceServers = [{
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302"
    ]
  }];

  const turnUrls = getValidTurnUrls(process.env.TURN_URLS);
  if (turnUrls.length > 0 && process.env.TURN_SECRET) {
    const expiresAt = Math.floor(Date.now() / 1000) + TURN_CREDENTIAL_LIFETIME_SECONDS;
    const username = `${expiresAt}:${crypto.randomBytes(8).toString("hex")}`;
    const credential = crypto.createHmac("sha1", process.env.TURN_SECRET)
      .update(username)
      .digest("base64");
    iceServers.push({
      username,
      credential,
      urls: turnUrls
    });
  }

  let xirsysConfigured = false;
  let xirsysServersAdded = false;
  if (process.env.XIRSYS_IDENT && process.env.XIRSYS_SECRET && process.env.XIRSYS_CHANNEL) {
    xirsysConfigured = true;
    if (!iceServerFetchPromise) {
      iceServerFetchPromise = fetchXirsysIceServers().catch((error) => {
        console.error("Unable to obtain Xirsys ICE servers:", error.message);
        return null;
      }).finally(() => {
        iceServerFetchPromise = null;
      });
    }

    const xirsysIceServers = await iceServerFetchPromise;
    if (Array.isArray(xirsysIceServers) && xirsysIceServers.length > 0) {
      iceServers.push(...xirsysIceServers);
      xirsysServersAdded = true;
    }
  }

  iceServerCache = {
    expiresAt: Date.now() + getIceServerCacheLifetimeMs({
      xirsysConfigured,
      xirsysServersAdded
    }),
    iceServers
  };
  return { iceServers };
}

async function fetchXirsysIceServers() {
  const pathValue = process.env.XIRSYS_PATH || "https://global.xirsys.net";
  const channel = process.env.XIRSYS_CHANNEL;
  if (!/^https:\/\//i.test(pathValue) || !/^[-A-Za-z0-9_]{1,128}$/.test(channel || "")) {
    throw new Error("Invalid Xirsys configuration");
  }

  const url = `${pathValue.replace(/\/+$/, "")}/_turn/${encodeURIComponent(channel)}?webrtc=1`;
  const auth = Buffer.from(
    `${process.env.XIRSYS_IDENT}:${process.env.XIRSYS_SECRET}`,
    "utf8"
  ).toString("base64");

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`Xirsys returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  const servers = payload?.v?.iceServers ?? payload?.v?.ice_servers ?? payload?.v;
  if (!Array.isArray(servers)) return null;

  return servers.map((server) => {
    const urls = Array.isArray(server?.urls)
      ? server.urls
      : (typeof server?.urls === "string" ? [server.urls] : []);
    const validUrls = urls.filter((url) =>
      typeof url === "string" &&
      /^(stun|turn|turns):/i.test(url.trim())
    );
    if (!validUrls.length) return null;

    const cleaned = { urls: validUrls };
    if (typeof server.username === "string") cleaned.username = server.username;
    if (typeof server.credential === "string") cleaned.credential = server.credential;
    return cleaned;
  }).filter(Boolean);
}



function getClientCount(roomName) {
  const room = io.sockets.adapter.rooms.get(roomName);
  if (room) {
    return room.size;
  }
  return 0;
}
