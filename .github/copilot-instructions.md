# Copilot Repository Instructions

## Project identity

Joker4P is an ES-module Node.js and browser game. The server is a single `server.js` process using Express and Socket.IO. The browser uses Phaser 4.2.1, Socket.IO, WebRTC, Bootstrap, session storage, and in-memory server state. There is no database and no build step.

## Before changing code

- Read `server.js`, the relevant helper, and `src/scenes/game.js` for changes that cross networking, state, or rendering.
- Preserve the Phaser 1490x825 fixed scene and existing atlas frame names.
- Preserve room and player behavior unless a request explicitly changes it.
- Use the existing ES-module style (`import`/`export`, `"type": "module"`).
- Keep room names and join player names ASCII alphanumeric.
- Treat browser input and Socket.IO data as untrusted.
- Run the smallest relevant test and then `npm test`.

## Commands

```bash
npm start
npm test
node --test
```

`npm start` serves the repository at port 5056 unless `PORT` is set.

## Architecture rules

- `server.js` owns Socket.IO transport handlers and server configuration.
- `src/helpers/serverstate.js` owns process-local users, room card state, and marble snapshots.
- `src/scenes/game.js` is the main client scene; keep new code surgical because it is already large.
- Card IDs must match the atlas frames and `ORIGINAL_DECK` identifiers.
- Marble names must remain exactly:
  `top1`-`top5`, `right1`-`right5`, `bottom1`-`bottom5`, and `left1`-`left5`.
- Room state must remain process-local unless a persistence/shared-state change is part of the task.
- WebRTC signaling should stay relay-only through Socket.IO; do not put secrets or TURN credentials in browser source.
- Reuse one local media stream across peer connections and avoid renegotiation for track enable/disable toggles.
- Keep SDP descriptions bounded to 64 KiB and ICE candidates bounded to 4096 characters.

## State and networking conventions

- Player slots are strings `"1"` through `"4"` in some client/server comparisons but numbers in card turn state. Convert explicitly rather than using implicit coercion.
- Card state has one hand per player and one draw deck per room.
- Validate socket payload shape, type, length, and player membership in `server.js`.
- Use server sequences for snapshot updates and reject stale sequences in the client.
- `objMoveData` and `marbleState` are separate transport paths; merge them only after defining a single snapshot contract.
- Do not assume a browser's displayed player number equals its server-assigned slot.
- Preserve the reconnect grace period unless deliberately redesigning it.

## Security requirements

- Never expose `.env`, TURN secrets, private keys, tokens, or credentials in code, logs, docs, tests, or responses.
- Do not broaden Express static serving; do not serve `node_modules` or repository files in production.
- Keep `TURN_URLS`/`TURN_SECRET` server-side only when implementing TURN.
- Validate every Socket.IO payload before indexing state, reading properties, or broadcasting.
- Keep SDP, ICE, room names, card IDs, coordinates, and names bounded.
- Rate-limit new destructive or state-changing socket events.
- Prefer allowlists over broad object passes.
- Add replay/action protection for game actions; do not trust winners, turns, or collision results from a client.

## Performance requirements

- Keep live marble drag updates throttled.
- Do not broadcast unchanged marble positions.
- Keep card and marble atlas usage; do not introduce per-object runtime assets.
- Avoid repeated DOM lookups, object creation, and full snapshot copies in hot drag/collision paths.
- When touching WebRTC, clean peer handlers, ICE timers, media tracks, and remote video elements together.
- Use Maps/indexes if changing store lookup code rather than adding more linear array scans.

## Game logic requirements

- Treat the current game rules as split between:
  - server card drawing/ownership checks
  - client collision and partner/opponent marble logic
  - client turn text
- Do not claim that server turn enforcement exists when it does not.
- For any implementation of turn order, add state to `RoomGameStore` and verify it with store tests.
- Keep winner semantics: green+red are partners, and yellow+blue are partners.
- Preserve card recycling behavior unless redesigning deck lifecycle.

## Testing requirements

- Tests use Node's built-in runner and live in `test/gameutils.test.js`.
- Add focused tests beside related state/helper behavior.
- Test malformed input and boundary values, not only happy paths.
- Test cards with all four player slots, out-of-turn cards, wrong cards, replayed actions, reconnects, and room cleanup.
- Do not add Phaser mocks unless necessary; extraction to pure helpers is preferred.

## Known failing tests

As currently implemented, `npm test` has two failures:

- `RoomGameStore enforces turn order and monotonic replay protection`
- `all four players can play cards only during their server-assigned turn`

These tests expect `activePlayer`, `pendingCardPlayer`, and `completeMarbleAction`, but these APIs are absent from `RoomGameStore` and `server.js` does not provide server turn enforcement. Do not remove or weaken these tests.
