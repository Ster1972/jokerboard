# Features

## Confirmed functionality

### Landing and rules

- A landing page asks for a player name and game/room name.
- Both fields must be non-empty in the browser.
- The server later restricts both values to ASCII letters and digits for room joining.
- The instructions page documents setup, card effects, movement, partnerships, and win conditions.

### Multiplayer rooms

- Rooms are identified by the submitted room name.
- Each room supports at most four connected users.
- Player slots are numbered 1 through 4 and correspond to board colors/sides.
- Room membership, player names, and player numbers are refreshed and broadcast to clients.
- A user can rename their own displayed player slot through the name modal.
- Disconnection removes live WebRTC and updates room indicators; disconnected users have five minutes to reconnect.
- Room state is recovered into a joining socket through the server snapshot.

### Reconnection

- The server creates a random 32-byte hexadecimal session token for a new player.
- The token is sent to the browser and stored in `sessionStorage`.
- If a player disconnects and returns with the same room, name, and token, player number and slot identity are restored.
- Marble and card state remain while a disconnected player is absent; state is removed when the room is empty after the five-minute timeout.

### Cards

- `createHands()` shuffles two logical standard decks with jokers and duplicate/ranked identifiers into a 108-card deck.
- Each player receives six cards when the room reaches four players and a player presses New Game.
- A card is played by dragging it onto the central drop zone.
- The card's frame is the card ID transmitted to the room.
- The server validates that the submitted card and position belong to the submitting player's server player number and hand.
- Playing replaces the submitted card with another card drawn from the deck and returns the replacement only to the playing client.
- The played card is visible in the drop zone for all clients.
- Played cards are recycled by shuffle when the draw deck is empty.

Current limitation: the implementation does not enforce the documented turn order during server `cardPlayedclient`; it relies on client-side state and color-turn text.

### Marble board

- The board contains a 1490x825 scene with 20 marbles, 5 for each side.
- Board holes are rendered as Phaser physics objects and repeated in the board helper.
- Marbles support dragging and snapping to the nearest board hole.
- Incoming card play is marked by `newcardplayed`, then the client's local turn logic may advance the displayed color.
- Collision functions move marbles back to starts, move partner marbles, move opponent marbles to starts, or block some moves based on board occupancy.
- Winners are calculated by whether all five green/red or yellow/blue marbles occupy partner home areas.

### Multiplayer position synchronization

- Dragging emits `objMoveData` at up to 30 updates per second and on drag end.
- A validated drag also updates the server's room snapshot through `marbleState`.
- Delta events exclude the sender and contain only the changed marble positions plus turn/reset metadata.
- Sequence numbers reject stale or reordered snapshot deltas.
- Rejoining clients receive stored marble positions and card/turn state through `updateGameState`.

### WebRTC video and audio

- The browser requests local audio and video with echo cancellation and noise suppression.
- The current default media profile requests 960x540 video at an ideal 24 fps, with a 30 fps maximum.
- The browser reuses the same local stream for all peer connections; track enable/disable changes do not require renegotiation.
- One peer connection can be maintained for each other room member.
- Socket.IO relays offer/answer signaling, ICE candidates, and disconnect cleanup.
- The game displays local and remote video and supports local camera and microphone toggles.
- A TURN configuration is used when TURN environment configuration is present; otherwise the server advertises only its STUN URL.
- Disconnected or failed peers are closed and video DOM elements are removed.

## Critical functionality

1. Four-player room capacity and player-slot assignment.
2. Card dealing, card ownership validation, replacement, and recycling.
3. Reconnect identity and state restoration.
4. Marble position and snapshot synchronization.
5. Collision and partnership rules.
6. Winner detection and team result broadcast.
7. WebRTC media signaling and peer cleanup.

## Feature gaps

- Turn order is described in rules and tests but not implemented by the server store.
- Replay/action deduplication is absent despite tests expecting it.
- Client-side game logic is authoritative for collision outcomes.
- The browser can submit peer names and slot controls without a stronger server identity model.
- New Game and winner behavior are coordinated through broadcasts rather than a complete game lifecycle state machine.
