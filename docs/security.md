# Security

## Security posture

The repository is a small real-time browser game prototype. It has input validation and a reconnect token, but it lacks authentication, authorization, database-backed state, CSRF/authentication infrastructure, TLS setup, and comprehensive server-side game-rule enforcement. Browser clients are trusted for much of the game behavior.

## Security-sensitive areas

### Room and player joining

`server.js` validates `joinServer` data and restricts room and player names to alphanumeric ASCII strings. It also:

- checks a per-socket join rate limit
- prevents joining more than four room clients
- assigns player slots only if unoccupied
- stores reconnect identity in the in-memory room store

Name updates are limited to 30 characters and `/^[a-zA-Z0-9 ]+$/`. Other untrusted socket fields have separate length/type checks.

### Session reconnect tokens

Each new player receives a 32-byte cryptographically random token generated with `crypto.randomBytes`. Reconnection requires room name, player name, socket, and token match.

The token is sent in Socket.IO and stored in browser `sessionStorage`, so it is readable by any script executing in the page origin and survives refresh until cleared. It is not a network-authenticated bearer secret for privileged operations, but it is still the reconnect identity mechanism.

### Socket event rate limits

`checkLimit()` applies in-memory per-socket/per-event counters for joins, signaling, movement, names, deals, and markers. Rate limits cover abuse, but counters are process-local and never removed for every disconnected event/key. A long-running server can accumulate stale map entries.

### Card game state

The server validates the card value length, player slot, card position, and existing hand value before replacing a card. It does not verify server-assigned turn state because `activePlayer` and replay controls are not implemented in the current store. A malicious client may therefore trigger card events that the server will accept out of turn.

### Marble and winner data

`marbleState` validates:

- named marble IDs
- finite coordinates
- absolute coordinate bounds of 2000
- maximum 20 changes
- membership in the room through `getUserById`

`markerclient` validates finite coordinates, `winner` accepts only `gr` or `yb`, and object movement validates finite positions plus a string name and finite coordinates. Snapshot sequences are server generated.

These checks protect transport shape but do not validate game rules such as legal card moves, legal paths, collisions, ownership, or victory conditions. Winner calculation is accepted unconditionally from the socket and broadcast.

### WebRTC signaling

SDP, ICE, and peer identity fields are relayed only to recipients that match a room user. SDP and candidate strings are not structurally bounded beyond the signaling rate limit. The TURN secret is used only server-side to generate HMAC-SHA1 time-limited credentials.

Privacy considerations:

- media requires camera/microphone browser permission
- remote media is peer-to-peer when connectivity permits
- signaling metadata and room membership pass through Socket.IO
- remote tracks and local tracks remain in browser peer objects until explicit cleanup or peer failure

### Static serving

The Express server uses:

```js
app.use(express.static(path.join(__dirname, "/")));
```

This serves the repository directory, not a dedicated public directory. It can make source files, configuration, git files if deployed beneath Express (the `.git` directory may not be served without special static behavior), `node_modules`, package metadata, tests, and environment files more broadly accessible according to static routing and dotfile policy. Ensure production deployments never expose environment secrets or private files and prefer an explicit `public/` directory.

The `.env` file is already excluded from Git but the server reads environment variables through `dotenv/config`. The available environment variable names are sensitive configuration names only; current server code specifically checks `TURN_URLS` and `TURN_SECRET`, while the `.env` file does not appear to use those names. Treat all TURN credentials as secrets and rotate them if exposed.

## Input and browser risks

- Player and card text is rendered through Phaser text/image APIs; the known names are regex-validated in socket handlers.
- There is no CSP, Trusted Types policy, or security headers configuration.
- Bootstrap, WebRTC adapter, and other browser assets use remote CDNs or integrity attributes in some HTML pages.
- Socket.IO origin/CORS policy is left at defaults and should be reviewed for production.
- HTTPS and secure WebSocket deployment must be provided by the hosting environment.
- No authentication distinguishes a participant from anyone who knows a room and name.

## Technical debt and recommended controls

1. Implement server-authoritative turns and legal card/marble actions.
2. Add monotonic action IDs and replay protection before state changes.
3. Move game state transitions to a room-owned state machine.
4. Add room authentication or signed join tickets.
5. Bind reconnect identities to a short-lived signed/cryptographically protected server session.
6. Serve only a dedicated public directory.
7. Add Helmet/security headers and a CSP appropriate for Phaser, Socket.IO, and WebRTC.
8. Add TURN credential TTL config and deployment validation.
9. Remove or bound stale rate-limit map entries.
10. Add server and integration tests for unauthorized room actions and malformed signaling payloads.
