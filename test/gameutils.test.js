import test from "node:test";
import assert from "node:assert/strict";

import { createHands, isAlphanumeric, shuffle } from "../src/helpers/gameutils.js";
import { RoomGameStore } from "../src/helpers/serverstate.js";
import { getNearestBoardHole } from "../src/helpers/boardholes.js";
import {
  BoundedIceCandidateQueue,
  SerializedOperations,
  addLocalTracks,
  isPeerCurrent
} from "../src/helpers/webrtc.js";

test("addLocalTracks reuses senders and replaces tracks by media kind", async () => {
  const replacementCalls = [];
  const addedTracks = [];
  const audioTrack = { kind: "audio" };
  const videoTrack = { kind: "video" };
  const peer = {
    getSenders: () => [
      { track: audioTrack, replaceTrack: (track) => {
        replacementCalls.push(track);
        return Promise.resolve();
      } }
    ],
    addTrack: (track) => addedTracks.push(track)
  };
  const stream = { getTracks: () => [audioTrack, videoTrack] };

  assert.equal(addLocalTracks(peer, stream), true);
  await Promise.resolve();

  assert.deepEqual(replacementCalls, []);
  assert.deepEqual(addedTracks, [videoTrack]);
});

test("bounded ICE candidate queue keeps only the newest candidates", () => {
  const queue = new BoundedIceCandidateQueue(3);
  queue.push({ candidate: "one" });
  queue.push({ candidate: "two" });
  queue.push({ candidate: "three" });
  queue.push({ candidate: "four" });

  assert.deepEqual(queue.drain(), [
    { candidate: "two" },
    { candidate: "three" },
    { candidate: "four" }
  ]);
  assert.deepEqual(queue.drain(), []);
});

test("serialized operations do not overlap and continue after errors", async () => {
  const operations = new SerializedOperations();
  const order = [];
  await Promise.all([
    operations.run(async () => {
      order.push("first-start");
      await Promise.resolve();
      order.push("first-end");
    }),
    operations.run(async () => {
      order.push("second");
    })
  ]);
  await assert.rejects(
    operations.run(async () => {
      throw new Error("expected");
    }),
    /expected/
  );
  await operations.run(async () => order.push("after-error"));
  assert.deepEqual(order, ["first-start", "first-end", "second", "after-error"]);
});

test("peer identity guard rejects callbacks from replaced peers", () => {
  const oldPeer = {};
  const newPeer = {};
  const registry = { "peer-a": oldPeer };

  assert.equal(isPeerCurrent(registry, "peer-a", oldPeer), true);
  assert.equal(isPeerCurrent(registry, "peer-a", newPeer), false);
  registry["peer-a"] = newPeer;
  assert.equal(isPeerCurrent(registry, "peer-a", newPeer), true);
});

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

test("RoomGameStore merges marble deltas into reconnect snapshots", () => {
  const store = new RoomGameStore();
  store.updateMarbleState(["room1", ...Array.from({ length: 20 }, (_, index) => ({
    x: index,
    y: index * 2
  })), "green", false]);

  const snapshot = store.updateMarbleDelta("room1", [
    { name: "top3", x: 370, y: 100 },
    { name: "right5", x: 450, y: 720 }
  ], "yellow", true);

  assert.equal(snapshot.length, 23);
  assert.deepEqual(snapshot[3], { x: 370, y: 100 });
  assert.deepEqual(snapshot[10], { x: 450, y: 720 });
  assert.equal(snapshot[21], "yellow");
  assert.equal(snapshot[22], true);
  assert.equal(store.getMarbleStates("room1")[0][0], "room1");
});

test("RoomGameStore enforces turn order and monotonic replay protection", () => {
  const store = new RoomGameStore();
  store.addUser({ gameName: "room1", player: "Ada", id: "socket-1", playernum: "1" });
  store.addUser({ gameName: "room1", player: "Lin", id: "socket-2", playernum: "2" });
  store.setCardState({
    roomName: "room1",
    hand1: ["a", "b"],
    hand2: ["c", "d"],
    hand3: ["e"],
    hand4: ["f"],
    gameDeck: ["g"],
    cardsplayed: [],
    activePlayer: 1,
    authoritative: true
  });

  assert.equal(store.playCard("room1", "c", 2, 0), null);
  assert.equal(store.playCard("room1", "a", 1, 0), "g");
  assert.equal(store.getCardState("room1").pendingCardPlayer, 1);

  const first = store.completeMarbleAction("room1", 1, "action-1", [
    { name: "bottom1", x: 450, y: 720 }
  ]);
  assert.ok(first);
  assert.equal(first.activePlayer, 2);
  assert.equal(store.completeMarbleAction("room1", 1, "action-2", []), null);
  assert.equal(store.completeMarbleAction("room1", 2, "action-1", []), null);
});

test("all four players can play cards only during their server-assigned turn", () => {
  const store = new RoomGameStore();
  for (const playerNum of [1, 2, 3, 4]) {
    store.addUser({
      gameName: "room1",
      player: `Player ${playerNum}`,
      id: `socket-${playerNum}`,
      playernum: String(playerNum)
    });
  }
  store.setCardState({
    roomName: "room1",
    hand1: ["a1", "a2"],
    hand2: ["b1", "b2"],
    hand3: ["c1", "c2"],
    hand4: ["d1", "d2"],
    gameDeck: ["a3", "b3", "c3", "d3"],
    cardsplayed: [],
    activePlayer: 1,
    authoritative: true
  });

  for (const [playerNum, card] of [
    [1, "a1"], [2, "b1"], [3, "c1"], [4, "d1"]
  ]) {
    assert.equal(store.getCardState("room1").activePlayer, playerNum);
    assert.equal(store.playCard("room1", card, playerNum, 0), `${card[0]}3`);
    assert.equal(store.completeMarbleAction("room1", playerNum, `action-${playerNum}`, []).activePlayer,
      playerNum === 4 ? 1 : playerNum + 1);
  }
});
