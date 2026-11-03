"use strict";

import { shuffle } from "./gameutils.js";

export class RoomGameStore {
  constructor() {
    this.users = [];
    this.marbleStates = [];
    this.cardStates = [];
  }

  getCardState(roomName) {
    return this.cardStates.find((state) => state.roomName === roomName);
  }

  addUser(user) {
    this.users.push({ ...user, connected: true });
    return user;
  }

  getUserById(id) {
    return this.users.find((user) => user.id === id);
  }

  getUsersInRoom(roomName) {
    return this.users.filter((user) =>
      user.gameName === roomName && user.connected !== false
    );
  }

  reconnectUser(roomName, playerName, socketId, sessionToken) {
    if (!sessionToken) return undefined;
    const user = this.users.find((item) =>
      item.gameName === roomName &&
      item.player === playerName &&
      item.connected === false &&
      item.sessionToken === sessionToken
    );

    if (!user) return undefined;

    user.id = socketId;
    user.connected = true;
    if (user.disconnectTimer) {
      clearTimeout(user.disconnectTimer);
      user.disconnectTimer = undefined;
    }
    return user;
  }

  disconnectUser(id) {
    const user = this.getUserById(id);
    if (!user) return undefined;

    user.connected = false;
    if (user.disconnectTimer) clearTimeout(user.disconnectTimer);
    user.disconnectTimer = setTimeout(() => {
      this.removeUser(id);
      if (this.getUsersInRoom(user.gameName).length === 0) {
        this.removeCardState(user.gameName);
        const marbleIndex = this.marbleStates.findIndex((state) => state[0] === user.gameName);
        if (marbleIndex !== -1) this.marbleStates.splice(marbleIndex, 1);
      }
    }, 5 * 60 * 1000);
    return user;
  }

  hasPlayerInRoom(playerNum, roomName) {
    return this.getUsersInRoom(roomName)
      .some((user) => user.playernum === playerNum);
  }

  updateUserName(id, playerName) {
    const user = this.getUserById(id);
    if (!user) return false;

    user.player = playerName;
    return true;
  }

  removeUser(id) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return undefined;

    return this.users.splice(index, 1)[0];
  }

  getMarbleStates(roomName) {
    return this.marbleStates.filter((state) => state[0] === roomName);
  }

  updateMarbleDelta(roomName, changes, turn, reset) {
    const current = this.getMarbleStates(roomName)[0];
    const MARBLE_SLOTS = [
      "top1", "top2", "top3", "top4", "top5",
      "right1", "right2", "right3", "right4", "right5",
      "bottom1", "bottom2", "bottom3", "bottom4", "bottom5",
      "left1", "left2", "left3", "left4", "left5"
    ];

    let next;
    if (current && Array.isArray(current)) {
      next = [roomName, ...current.slice(1, 21).map((marble) => ({
        x: marble.x,
        y: marble.y
      }))];
    } else {
      next = [
        roomName,
        ...[
          { x: 370, y: 100 }, { x: 370, y: 140 }, { x: 370, y: 180 }, { x: 330, y: 140 }, { x: 410, y: 140 },
          { x: 710, y: 370 }, { x: 670, y: 370 }, { x: 630, y: 370 }, { x: 670, y: 330 }, { x: 670, y: 410 },
          { x: 450, y: 720 }, { x: 450, y: 680 }, { x: 450, y: 640 }, { x: 490, y: 680 }, { x: 410, y: 680 },
          { x: 100, y: 450 }, { x: 140, y: 450 }, { x: 180, y: 450 }, { x: 140, y: 490 }, { x: 140, y: 410 }
        ]
      ];
    }

    for (const change of changes) {
      const index = MARBLE_SLOTS.indexOf(change.name);
      if (index !== -1) next[index + 1] = { x: change.x, y: change.y };
    }

    next[21] = typeof turn === "string" ? turn.slice(0, 120) : "";
    next[22] = Boolean(reset);
    this.updateMarbleState(next);
    return next;
  }

  updateMarbleState(state) {
    const roomName = state[0];
    const index = this.marbleStates.findIndex((item) => item[0] === roomName);

    if (index !== -1) {
      this.marbleStates.splice(index, 1);
    }

    this.marbleStates.push(state);
  }

  setCardState(state) {
    state.lastCardPlayed = "";
    state.activePlayer = Number.isInteger(Number(state.activePlayer))
      ? Number(state.activePlayer)
      : 1;
    state.turnVersion = Number.isInteger(state.turnVersion) ? state.turnVersion : 0;
    state.pendingCardPlayer = null;
    state.winner = null;
    state.actionSequences = state.actionSequences || {};
    state.actionIds = state.actionIds || new Set();
    const index = this.cardStates.findIndex((item) => item.roomName === state.roomName);

    if (index !== -1) {
      this.cardStates.splice(index, 1);
    }

    this.cardStates.push(state);
  }

  removeCardState(roomName) {
    const index = this.cardStates.findIndex((state) => state.roomName === roomName);
    if (index !== -1) this.cardStates.splice(index, 1);
  }

  playCard(roomName, gameObj, board, pos) {
    const cardState = this.getCardState(roomName);
    if (!cardState || !Number.isInteger(pos) || pos < 0) return null;
    const playerNum = Number(board);
    if (cardState.authoritative && cardState.activePlayer !== playerNum) return null;
    if (cardState.winner) return null;

    const handByPlayer = {
      1: cardState.hand1,
      2: cardState.hand2,
      3: cardState.hand3,
      4: cardState.hand4
    };
    const hand = handByPlayer[board];
    if (!hand || pos >= hand.length) return null;
    if (hand[pos] !== gameObj) return null;

    cardState.cardsplayed.push(gameObj);
    cardState.lastCardPlayed = gameObj;

    if (cardState.gameDeck.length === 0 && cardState.cardsplayed.length > 0) {
      shuffle(cardState.cardsplayed);
      cardState.gameDeck.push(...cardState.cardsplayed);
      cardState.cardsplayed.length = 0;
    }

    const newCard = cardState.gameDeck.shift();
    if (newCard === undefined) return null;

    hand.splice(pos, 1, newCard);
    if (cardState.authoritative) {
      cardState.pendingCardPlayer = playerNum;
      cardState.turnVersion++;
    }
    return newCard;
  }

  getTurnText(roomName) {
    const cardState = this.getCardState(roomName);
    if (!cardState) return "";
    const activeUser = this.getUsersInRoom(roomName)
      .find((user) => Number(user.playernum) === cardState.activePlayer);
    if (!activeUser) return "";
    return `${activeUser.player}'s turn${cardState.pendingCardPlayer ? "" : "\n"}`;
  }

  completeMarbleAction(roomName, playerNum, actionId, changes) {
    const cardState = this.getCardState(roomName);
    if (!cardState || !cardState.authoritative || cardState.winner) return null;
    playerNum = Number(playerNum);
    if (cardState.activePlayer !== playerNum || cardState.pendingCardPlayer !== playerNum) return null;

    if (typeof actionId === "string" && actionId.length <= 100) {
      if (cardState.actionIds.has(actionId)) return null;
      cardState.actionIds.add(actionId);
      if (cardState.actionIds.size > 500) {
        cardState.actionIds = new Set([...cardState.actionIds].slice(-250));
      }
    }

    const snapshot = this.updateMarbleDelta(roomName, changes, "", false);
    cardState.pendingCardPlayer = null;
    cardState.activePlayer = (playerNum % 4) + 1;
    cardState.turnVersion++;

    const winner = this.detectWinner(snapshot);
    if (winner) {
      cardState.winner = winner;
      snapshot[22] = true;
      this.updateMarbleState(snapshot);
    } else {
      snapshot[22] = false;
      this.updateMarbleState(snapshot);
    }
    return {
      snapshot,
      activePlayer: cardState.activePlayer,
      turnText: this.getTurnText(roomName),
      winner
    };
  }

  detectWinner(snapshot) {
    if (!snapshot) return null;
    const marbles = snapshot.slice(1, 21);
    const homeGroups = {
      top: [[170, 100], [170, 140], [170, 180], [210, 180], [250, 180]],
      right: [[720, 170], [680, 170], [640, 170], [640, 210], [640, 250]],
      bottom: [[650, 720], [650, 680], [650, 640], [610, 640], [570, 640]],
      left: [[100, 650], [140, 650], [180, 650], [180, 610], [180, 570]]
    };
    const groups = [
      ["green", marbles.slice(0, 5), homeGroups.top],
      ["yellow", marbles.slice(15, 20), homeGroups.left],
      ["red", marbles.slice(10, 15), homeGroups.bottom],
      ["blue", marbles.slice(5, 10), homeGroups.right]
    ];
    const isFull = (positions, homes) => homes.every(([x, y]) =>
      positions.some((position) => Math.hypot(position.x - x, position.y - y) <= 30)
    );
    const full = new Set(groups.filter(([, positions, homes]) => isFull(positions, homes)).map(([name]) => name));
    if (full.has("green") && full.has("red")) return "gr";
    if (full.has("yellow") && full.has("blue")) return "yb";
    return null;
  }
}
