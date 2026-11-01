import test from "node:test";
import assert from "node:assert/strict";

import { createHands, isAlphanumeric, shuffle } from "../src/helpers/gameutils.js";

test("isAlphanumeric preserves the room and username validation contract", () => {
  assert.equal(isAlphanumeric("Room123"), true);
  assert.equal(isAlphanumeric("player-name"), false);
  assert.equal(isAlphanumeric("player name"), false);
  assert.equal(isAlphanumeric(""), false);
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
