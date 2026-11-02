import test from "node:test";
import assert from "node:assert/strict";

import { createHands, isAlphanumeric, shuffle } from "../src/helpers/gameutils.js";
import { RoomGameStore } from "../src/helpers/serverstate.js";
import { getNearestBoardHole } from "../src/helpers/boardholes.js";

test("getNearestBoardHole returns the exact center of the nearest hole", () => {
  const gameBoard = {
    getChildren: () => [
      { x: 50, y: 90 },
      { x: 370, y: 100 },
      { x: 450, y: 720 }
    ]
  };

  assert.deepEqual(getNearestBoardHole(gameBoard, 368, 101), { x: 370, y: 100 });
  assert.equal(getNearestBoardHole(gameBoard, 5, 5), null);
});

test("isAlphanumeric preserves the room and username validation contract", () => {
  assert.equal(isAlphanumeric("Room123"), true);
  assert.equal(isAlphanumeric("player-name"), false);
  assert.equal(isAlphanumeric("player name"), false);
  assert.equal(isAlphanumeric(""), false);
  assert.equal(isAlphanumeric(undefined), false);
});

test("shuffle retains every input card exactly once", () => {
  const cards = ["a", "b", "c", "d"];
  const shuffled = shuffle(cards);

  assert.equal(shuffled.length, 4);
  assert.deepEqual([...shuffled].sort(), ["a", "b", "c", "d"]);
});

test("createHands deals six cards to each player and retains the remaining deck", () => {
  const { hand1, hand2, hand3, hand4, gameDeck, cardsplayed } = createHands();

  assert.equal(hand1.length, 6);
  assert.equal(hand2.length, 6);
  assert.equal(hand3.length, 6);
  assert.equal(hand4.length, 6);
  assert.equal(gameDeck.length, 84);
  assert.deepEqual(cardsplayed, []);

  const dealtCards = [...hand1, ...hand2, ...hand3, ...hand4, ...gameDeck];
  assert.equal(new Set(dealtCards).size, 108);
  assert.equal(dealtCards.length, 108);
});

test("RoomGameStore tracks users and removes disconnected users safely", () => {
  const store = new RoomGameStore();

  store.addUser({ gameName: "room1", player: "Ada", id: "socket-1", playernum: "1" });
  store.addUser({ gameName: "room2", player: "Lin", id: "socket-2", playernum: "1" });

  assert.equal(store.getUsersInRoom("room1").length, 1);
  assert.equal(store.hasPlayerInRoom("1", "room2"), true);
  assert.equal(store.updateUserName("missing", "New Name"), false);
  assert.equal(store.updateUserName("socket-1", "Grace"), true);
  assert.equal(store.getUserById("socket-1").player, "Grace");
  assert.equal(store.removeUser("missing"), undefined);
  assert.equal(store.removeUser("socket-1").player, "Grace");
});

test("RoomGameStore replaces a played card and recycles an empty deck", () => {
  const store = new RoomGameStore();
  store.setCardState({
    roomName: "room1",
    hand1: ["a", "b", "c"],
    hand2: ["d"],
    hand3: ["e"],
    hand4: ["f"],
    gameDeck: ["g"],
    cardsplayed: []
  });

  assert.equal(store.playCard("room1", "a", 1, 0), "g");
  assert.deepEqual(store.getCardState("room1").hand1, ["g", "b", "c"]);

  const recycledCard = store.playCard("room1", "g", 1, 0);
  assert.ok(["a", "g"].includes(recycledCard));
  assert.equal(store.getCardState("room1").hand1[0], recycledCard);
});

test("RoomGameStore preserves player identity and game state across reconnect", () => {
  const store = new RoomGameStore();
  store.addUser({ gameName: "room1", player: "Ada", id: "socket-old", playernum: "2", sessionToken: "token-a" });
  store.updateMarbleState(["room1", { x: 370, y: 100 }]);
  store.setCardState({
    roomName: "room1",
    hand1: ["a"],
    hand2: ["b", "c"],
    hand3: ["d"],
    hand4: ["e"],
    gameDeck: [],
    cardsplayed: []
  });

  const disconnected = store.disconnectUser("socket-old");
  assert.equal(disconnected.connected, false);
  assert.equal(store.getUsersInRoom("room1").length, 0);

  const reconnected = store.reconnectUser("room1", "Ada", "socket-new", "token-a");
  assert.equal(reconnected.playernum, "2");
  assert.equal(reconnected.connected, true);
  assert.equal(store.getUsersInRoom("room1").length, 1);
  assert.equal(store.getMarbleStates("room1").length, 1);
  assert.deepEqual(store.getCardState("room1").hand2, ["b", "c"]);

  store.playCard("room1", "b", 2, 0);
  assert.equal(store.getCardState("room1").lastCardPlayed, "b");
});
