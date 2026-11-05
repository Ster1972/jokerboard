"use strict";

const ORIGINAL_DECK = [
  "2c", "2d", "2h", "2s", "3c", "3d", "3h", "3s",
  "4c", "4d", "4h", "4s", "5c", "5d", "5h", "5s",
  "6c", "6d", "6h", "6s", "7c", "7d", "7h", "7s",
  "8c", "8d", "8h", "8s", "9c", "9d", "9h", "9s",
  "10c", "10d", "10h", "10s", "jc", "jd", "jh", "js",
  "qc", "qd", "qh", "qs", "kc", "kd", "kh", "ks",
  "ac", "ad", "ah", "as", "bj", "rj",
  "22c", "22d", "22h", "22s", "33c", "33d", "33h", "33s",
  "44c", "44d", "44h", "44s", "55c", "55d", "55h", "55s",
  "66c", "66d", "66h", "66s", "77c", "77d", "77h", "77s",
  "88c", "88d", "88h", "88s", "99c", "99d", "99h", "99s",
  "110c", "110d", "110h", "110s", "jjc", "jjd", "jjh", "jjs",
  "qqc", "qqd", "qqh", "qqs", "kkc", "kkd", "kkh", "kks",
  "aac", "aad", "aah", "aas", "bbj", "rrj"
];

export function isAlphanumeric(value) {
  if (typeof value !== "string") return false;
  return /^[a-zA-Z0-9]+$/.test(value);
}

export function shuffle(array) {
  let remaining = array.length;

  while (remaining > 0) {
    const index = Math.floor(Math.random() * remaining);
    remaining--;
    const current = array[remaining];
    array[remaining] = array[index];
    array[index] = current;
  }

  return array;
}

export function createHands() {
  const gameDeck = shuffle([...ORIGINAL_DECK]);
  const hand1 = [];
  const hand2 = [];
  const hand3 = [];
  const hand4 = [];

  for (let i = 0; i < 6; i++) {
    hand1.push(gameDeck.shift());
    hand2.push(gameDeck.shift());
    hand3.push(gameDeck.shift());
    hand4.push(gameDeck.shift());
  }

  return {
    hand1,
    hand2,
    hand3,
    hand4,
    gameDeck,
    cardsplayed: []
  };
}
