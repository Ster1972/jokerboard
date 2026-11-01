"use strict";

import { shuffle } from "./gameutils.js";

export class RoomGameStore {
  constructor() {
    this.users = [];
    this.marbleStates = [];
    this.cardStates = [];
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

  reconnectUser(roomName, playerName, socketId) {
    const user = this.users.find((item) =>
      item.gameName === roomName &&
      item.player === playerName &&
      item.connected === false
    );

    if (!user) return undefined;

    user.id = socketId;
    user.connected = true;
    return user;
  }

  disconnectUser(id) {
    const user = this.getUserById(id);
    if (!user) return undefined;

    user.connected = false;
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

  updateMarbleState(state) {
    const roomName = state[0];
    const index = this.marbleStates.findIndex((item) => item[0] === roomName);

    if (index !== -1) {
      this.marbleStates.splice(index, 1);
    }

    this.marbleStates.push(state);
  }

  getCardState(roomName) {
    return this.cardStates.find((state) => state.roomName === roomName);
  }

  setCardState(state) {
    state.lastCardPlayed = "";
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

    const handByPlayer = {
      1: cardState.hand1,
      2: cardState.hand2,
      3: cardState.hand3,
      4: cardState.hand4
    };
    const hand = handByPlayer[board];
    if (!hand || pos >= hand.length) return null;

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
    return newCard;
  }
}
