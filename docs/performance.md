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

WebRTC uses 1280x720 ideal video at 30 fps and peer connections for each participant. This is the largest bandwidth and CPU cost: video may remain active for every room. Candidate handling and track negotiation may create duplicate offers or reconnect timers.

Optimization:

- tune resolution/framerate by device and network
- add bandwidth/audio constraints
- stop tracks when hidden or disconnected
- verify offer/reply state before creating duplicate connections
- deduplicate recovery logic and ICE candidate queues

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
