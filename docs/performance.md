# Performance

## Performance-sensitive paths

### Marble drag updates

`game.js` sends live marble positions from the `drag` handler at most once per 33 ms using `socket.volatile.emit("objMoveData", ...)`. A final validated snapshot is sent on `dragend` through `marbleState`, which updates room state and broadcasts a delta excluding the sender.

The movement path can be costly under four clients because 20 marbles and repeated collision checks are evaluated in the client after every relevant drag end, and live updates are room broadcasts.

Optimization:

- retain 30/33-ms throttling
- batch marble updates already changed since the latest snapshot
- avoid sending unchanged coordinates
- use sequence-based snapshots consistently
- consider authoritative server-side snapshots rather than two movement protocols

### Collision detection

Drag end invokes multiple `physics.world.overlap` calls across board holes, home areas, and marble arrays. Some functions call overlap repeatedly with nested arrays for partner/opponent rules. Phaser then performs broader collision logic at the physics cadence.

Optimization:

- cache known hole/home objects and lookup tables
- replace repeated arrays/overlap probes with spatial lookup or tagged positions for small board size
- isolate tests from rendering so collision rules can be benchmarked
- reduce calculation in every drag event to only the affected marble/home pairs

### Board snapshot state

`RoomGameStore.updateMarbleState()` removes one room snapshot and pushes a new array. `updateMarbleDelta()` copies 20 marble records before applying changes. Rooms are small, so this is not currently a high-cost operation, but repeated array linear searches are used by every lookup.

Optimization:

- use Maps for users and room state
- keep one snapshot object per room instead of parallel arrays
- maintain one index per socket ID, player slot, and room

### Card state and hands

Drawing uses `Array.shift()` on the deck; the deck is small (initially 84 cards, decreasing during play) and draw frequency is low. Recycling shuffles the entire played-card array once when empty. Hands are at most six cards.

Optimization is low priority. Preserve cards as immutable IDs and avoid recreating Phaser card images repeatedly.

### Card and room UI recreation

`startNewGame` and `updateGameState` destroy and recreate Phaser card objects. Played cards are destroyed on drag and rematerialized from socket events. At normal gameplay scale this is acceptable but allocates browser objects frequently.

Optimization:

- pool card images for six hand slots plus drop-zone slot
- update existing frame/name where possible instead of destroy/create
- destroy only genuinely removed objects

### WebRTC media

WebRTC uses a 960x540 ideal video profile at 24 fps by default and one peer connection per participant. This is the largest bandwidth and CPU cost; video may remain active for every room. Candidate handling and track negotiation can create signaling retries.

Optimization:

- adaptive resolution/framerate by device and network
- reuse one local media stream across peers
- avoid renegotiation for video/audio mute toggles
- cache TURN credentials instead of generating them for every peer request
- bound and serialize SDP/ICE negotiation per peer
- add bandwidth/audio constraints
- stop tracks when hidden or disconnected
- verify offer/reply state before creating duplicate connections
- deduplicate recovery logic and ICE candidate queues

## WebRTC reliability implementation plan

The following plan addresses the highest-risk peer negotiation and recovery issues found in `src/scenes/game.js` and `server.js`.

Implementation status:

- Phase 1 is implemented: peer initialization is serialized per socket, SDP operations are serialized, ICE candidates are bounded, stale peers are identity-guarded, and offer collisions use polite-peer rollback.
- Phase 2 is implemented: ICE-server acknowledgment has a STUN fallback timeout, disconnected peers receive ICE restart before recreation, and failed peers are recreated with stale callback guards.
- Phase 3 is implemented: remote tracks support stream-less events and stream-backed events, track termination cleans remote DOM state, local track termination updates controls, and page hide/pageshow cleanup/reacquisition is normalized.
- Phase 4 unit coverage is implemented for candidate bounds, operation serialization, and peer replacement guards. Browser/WebRTC integration automation remains environment-dependent and should be run in a browser harness.
- Phase 5 diagnostics and documentation are implemented with a 30-second `window.__jokerWebRtcMetrics` sampling hook covering connection states, bytes, packet loss, and round-trip time where available.

### Phase 1: Per-peer state and signaling serialization

1. Introduce a peer-record model containing the `RTCPeerConnection`, signaling role, initialization promise, pending ICE candidates, offer-in-progress flag, remote stream, and recovery timers.
2. Synchronize peer creation so repeated `new user`, `newUserStart`, recovery, or SDP events reuse the same peer instead of creating overlapping connections.
3. Queue offer/answer SDP messages until the matching peer has been created and its ICE configuration is available.
4. Serialize `setRemoteDescription()`, `createAnswer()`, and `addIceCandidate()` operations per peer to prevent asynchronous WebRTC state transitions from interleaving.
5. Replace the current offerer-only setup with a bounded perfect-negotiation implementation that handles offer glare by comparing the polite peer role and rolling back when required.
6. Limit pending ICE candidates, discard stale candidates after peer replacement, and flush the queue only after a valid remote description is set.
7. Reject callbacks and recovery timers from closed or replaced peer objects by comparing both the peer ID and the peer record instance.

Acceptance criteria:

- A peer is created once for each room member and never duplicated by concurrent signaling events.
- Candidate arrival before SDP does not drop media.
- Offer/answer glare is handled without `InvalidStateError`.
- A closed peer cannot later add tracks, flush candidates, or emit DOM changes.

### Phase 2: Robust ICE and connection recovery

1. Add a bounded timeout for `getIceServer_Info` acknowledgment requests.
2. Use STUN-only configuration only when TURN credentials are unavailable, matching the server's current fallback behavior.
3. On an ICE `disconnected` state, first invoke ICE restart rather than immediately closing the connection.
4. Preserve the peer's existing offerer/polite role and queued media tracks across ICE restart.
5. On `failed`, close only the peer record that raised the failure and schedule one full peer recreation after a short cooldown.
6. Replace the 10-second disconnected timer and 2-second failed timer with a single recovery state machine featuring cancellation, backoff, and one active operation per peer.
7. Add `oniceconnectionstatechange` logging without changing the existing `connectionState` as the primary state source.

Acceptance criteria:

- A transient disconnected state can recover without closing the remote video element.
- Failed peers are recreated exactly once, not repeatedly by overlapping timers.
- ICE configuration timeouts leave a logged, safe fallback instead of hanging negotiation.
- Recovered peers retain the correct offer and answer roles.

### Phase 3: Media and remote-track lifecycle

1. Create one remote `MediaStream` per peer and add/remove its audio and video tracks from `ontrack` and track-ended events.
2. Keep track attachment independent of `event.streams[0]`; support browsers that emit a track without an associated stream.
3. Add local track `ended` handling so device loss removes stale tracks or requests a replacement device when appropriate.
4. Consolidate screen-share state because the implementation currently has an unused `screen` branch and no active screen-share code.
5. Normalize cleanup across Phaser `shutdown()`, `pagehide`, Socket.IO disconnect/reconnect, and browser bfcache restoration.
6. Reset track/button UI state after permission failure or local device loss.
7. Preserve direct track enable/disable behavior and avoid renegotiation for mute toggles.

Acceptance criteria:

- Remote video remains available when `streams[0]` is absent.
- Local track loss does not leave dead senders or stale DOM video.
- Page hide, socket reconnect, and scene shutdown close or reuse peers consistently.
- Camera and microphone toggles continue to require no renegotiation.

### Phase 4: Browser and server integration coverage

1. Add browser/WebRTC integration tests for offer-before-peer setup, answer-before-offer setup, candidate-before-SDP, offer glare, duplicate `new user` events, and late ICE candidates.
2. Add transient-disconnect and repeated-failure simulations that verify one recovery operation and no stale peer callbacks.
3. Verify remote track handling with associated streams and track-only events.
4. Add TURN configuration tests for cache lifetime, missing TURN variables, and failed ICE-server acknowledgments.
5. Collect WebRTC metrics during four-player three-hour-style sessions: connection state duration, restart count, reconnection time, bytes sent/received, packet-loss indicators, and candidate-pair protocol.
6. Run repeated page-hide, Socket.IO reconnect, and browser bfcache tests in Chromium and Firefox.

Acceptance criteria:

- Browser tests cover all peer lifecycle transitions that affect media availability.
- Three-hour-style soak runs show no peer growth, timer growth, pending-candidate growth, or track duplication.
- TURN-only and STUN-only network configurations establish usable media or fail with a visible diagnostic.

### Static assets

Express reads files from disk directly. The repository serves Phaser, sprites, and sprite atlases from public paths. Browser caching behavior is delegated to Express defaults unless reverse-proxy or CDN configuration changes headers.

Optimization:

- serve a dedicated public directory
- use immutable asset caching for hashed/built assets
- use compression and HTTP caching in the reverse proxy
- bundle/minify client modules
- use texture atlases already present instead of loading separate card/marble images

### Server memory

The store retains:

- all users, including disconnected users for five minutes
- marble state arrays per room
- card state per room
- timer callbacks per disconnected socket
- rate-limit entries keyed by socket and event

Disconnected timer cleanup removes users and room state only after the timer expires or room empty. Stale rate-limit entries remain until their socket/event key is touched.

Optimization:

- clear rate-limit maps during disconnect
- add periodic cleanup or TTL data structures
- remove room state immediately when no active users remain if reconnect grace is not needed
- centralize room cleanup in one store method

## Performance measurements to add

The repository has no benchmarks or profiling configuration. Before optimization, add:

- unit benchmarks for deck shuffle/deal and snapshot delta application
- room simulation tests for 4, 20, 100, and 1000 connected rooms
- browser frame timing around drag and overlap handlers
- Socket.IO message counts and bytes per second per room
- WebRTC bandwidth per peer and CPU/media profile
- memory growth after repeated connect/disconnect cycles

## Expected optimization priority

1. Replace process-local arrays with indexed room maps for cleaner lookup costs.
2. Consolidate duplicate marble event protocols.
3. Pool card objects and add minimal collision lookup.
4. Separate state/game engine from Phaser scene rendering.
5. Add production asset build and cache headers.
