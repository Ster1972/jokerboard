# Phaser 4 Compliance Review - To-Do List

## Critical

- [ ] **Make multiplayer gameplay state server-authoritative**
  - Location: `server.js` (`marbleState` and game-action handlers); `src/scenes/game.js` (`dragend`)
  - Move turn ownership, legal moves, victory detection, deal rules, and card replacement to the server.
  - Submit player intents such as `moveMarble` instead of complete position snapshots.
  - Add action IDs, state versions, and replay/stale-action rejection.

## High

- [ ] **Authenticate and authorize room joins**
  - Location: `server.js` (`joinServer`)
  - Require a server-issued, short-lived join token bound to room, identity, expiry, and session.
  - Validate room membership at the Socket.IO handshake and during joining.
  - Do not trust room and player names supplied by first-time clients.

- [ ] **Split the monolithic game scene**
  - Location: `src/scenes/game.js`
  - Create separate controllers for Socket.IO networking, WebRTC signaling, media, cards, marbles, board rules, and UI.
  - Keep `Game` responsible for scene lifecycle and composition.
  - Target a focused scene class and small, testable modules.

- [ ] **Remove lifecycle leaks from DOM and Socket.IO listeners**
  - Location: `src/scenes/game.js` (`create()`, toggle handlers, Socket.IO handlers)
  - Remove DOM listeners in Phaser `shutdown()`.
  - Register Socket.IO handlers through one network manager.
  - Dispose listeners with `off()` or `removeAllListeners()` and disconnect the socket during shutdown.

- [ ] **Replace `sessionStorage` scene coupling**
  - Location: `src/scenes/game.js`, `src/scenes/index.js`
  - Pass room and user data through `init(data)` and `scene.start()`/`scene.restart()`.
  - Use a dedicated client session controller for token and player-seat state.
  - Remove player names and room state as hidden dependencies.

- [ ] **Enforce complete server-side game rules**
  - Location: `server.js` (`winner`, `colourturnclient`, `dealCardsclient`, `cardPlayedclient`)
  - Track active player, game phase, turn number, and dealt-card state on the server.
  - Reject actions outside the active turn.
  - Derive winner and turn transitions from authoritative state.
  - Prevent clients from closing arbitrary modals or setting turn/reset UI state.

## Medium

- [ ] **Add mobile-responsive Phaser scaling**
  - Location: `src/scenes/index.js`, `src/scenes/joker4p.html`
  - Replace or supplement fixed `1490 x 825` sizing with a deliberate responsive strategy.
  - Use `Phaser.Scale.RESIZE` or an appropriate safe-area/layout mode.
  - Remove viewport zoom restrictions and test portrait/landscape behavior.
  - Separate touch hit targets from desktop mouse targets where necessary.

- [ ] **Optimize board collision and marble rule processing**
  - Location: `src/scenes/game.js` (`dragend`, marble collision callbacks, `homefull`)
  - Reduce repeated `physics.world.overlap()` calls on drag completion.
  - Cache board holes and derive occupancy from shared geometry state.
  - Apply board rules after a marble is placed rather than running nested overlap checks.
  - Disable physics bodies for marbles once drag rules are complete if they are not needed continuously.

- [ ] **Pool or reuse card game objects**
  - Location: `src/scenes/game.js`, `src/helpers/cards.js`
  - Reuse a Phaser card pool for deal, replacement, reconnect, and discard rendering.
  - Update frame, depth, position, and interactivity instead of destroying and recreating every card.
  - Clear card groups consistently during new-game and reconnect paths.

- [ ] **Unify marble synchronization channels**
  - Location: `src/scenes/game.js`, `server.js`
  - Use one reliable server-validated action/snapshot protocol.
  - Keep volatile `moveObject` updates limited to rendering hints and reconciliation.
  - Remove conflicting legacy movement and snapshot paths.
  - Add monotonic sequence and stale-update checks to every synchronization channel.

- [ ] **Simplify and harden WebRTC track setup**
  - Location: `src/scenes/game.js` (`addMediaTracks`)
  - Create each audio/video transceiver once per peer.
  - Replace tracks through the existing sender.
  - Add one shared media-acquisition promise for every peer setup path.
  - Confirm codec preferences only after the transceiver exists and preserve fallback behavior.

- [ ] **Validate all client-provided network payloads**
  - Location: `server.js`
  - Allowlist event payload fields and known object names.
  - Bound coordinates and message lengths.
  - Reject unknown fields and malformed payloads.
  - Validate WebRTC SDP descriptions and ICE candidates against room membership and payload limits.

## Low

- [ ] **Introduce structured state and event types**
  - Add JSDoc types first, or migrate shared models and payloads to TypeScript.
  - Define room, user, card, marble, socket-session, and WebRTC peer types.
  - Replace loose state arrays with explicit snapshot and delta structures.

- [ ] **Centralize Phaser and network asset keys**
  - Location: `src/scenes/game.js`, `src/images`
  - Add constants for asset keys and frame names.
  - Move asset-loading configuration into a manifest or dedicated Boot scene.
  - Prevent texture/key mismatches caused by string duplication.

- [ ] **Clean up rate-limit state**
  - Location: `server.js` (`socketLimits`)
  - Delete socket rate-limit entries during `disconnect`.
  - Use one bounded limiter per socket rather than retaining stale event keys indefinitely.
  - Remove old entries even when the socket disconnects.

- [ ] **Improve error handling and logging**
  - Location: `src/scenes/game.js`, `src/helpers/videohelp.js`, `server.js`
  - Surface camera, WebRTC, SDP, Socket.IO, and media failures with user-visible or monitored error states.
  - Avoid logging sensitive session or TURN credential details.
  - Replace broad catches with operation-specific recovery behavior.

- [ ] **Review deprecated and removed v3 APIs**
  - Search for Phaser 3-specific APIs such as removed `setTintFill`, `Geom.Point`, pipelines, `BitmapMask`, `preFX`/`postFX`, and direct renderer internals.
  - The current code uses standard game objects and no custom pipeline/FX APIs, but every upgrade must be regression-tested.
  - Use Phaser 4 native `setTintMode()`, vectors, filters, and render nodes where applicable.

## Testing and Verification

- [ ] Add unit tests for server-authoritative marble transitions and card legality.
- [ ] Add tests for stale/replayed sequences and reconnect snapshots.
- [ ] Add tests for malformed Socket.IO payloads and room isolation.
- [ ] Add automated cleanup tests for scene restart and socket/DOM listener removal.
- [ ] Run four-browser join, reconnect, card-play, marble-sync, and WebRTC signaling tests.
- [ ] Test at mobile widths, heights, orientations, touch sizes, and low-end device settings.
- [ ] Measure rendering, physics overlap, network message frequency, memory growth, and WebRTC bandwidth.
- [ ] Run syntax checks, unit tests, HTTP smoke tests, and browser console checks after each change.

## Ranked Implementation Order

1. Server-authoritative gameplay state
2. Room authentication and join tokens
3. Server turn, phase, card, winner, and modal validation
4. Game scene and network/WebRTC controller split
5. Socket.IO and DOM lifecycle cleanup
6. Replace `sessionStorage` scene coupling
7. Remove conflicting marble synchronization paths
8. Pool card game objects
9. Optimize physics overlap and board rules
10. Add responsive mobile scaling
