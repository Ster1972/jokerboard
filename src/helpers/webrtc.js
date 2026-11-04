export const MAX_PENDING_ICE_CANDIDATES = 50;

export class BoundedIceCandidateQueue {
  constructor(max = MAX_PENDING_ICE_CANDIDATES) {
    this.max = max;
    this.items = [];
  }

  push(candidate) {
    if (candidate !== null) this.items.push(candidate);
    if (this.items.length > this.max) {
      this.items.splice(0, this.items.length - this.max);
    }
  }

  drain() {
    const items = this.items;
    this.items = [];
    return items;
  }

  clear() {
    this.items = [];
  }
}

export class SerializedOperations {
  constructor() {
    this.tail = Promise.resolve();
  }

  run(operation) {
    const result = this.tail.then(operation, operation);
    this.tail = result.catch(() => undefined);
    return result;
  }
}

export function isPeerCurrent(registry, peerId, peer) {
  return Boolean(peer && registry[peerId] === peer);
}

export function addLocalTracks(peer, stream) {
  if (!peer || !stream?.getTracks) return false;

  const tracks = stream.getTracks();
  if (!tracks.length) return false;
  const senders = peer.getSenders?.() || [];

  for (const track of tracks) {
    const sender = senders.find((item) => item.track?.kind === track.kind);
    if (sender) {
      if (sender.track !== track && typeof sender.replaceTrack === "function") {
        sender.replaceTrack(track).catch?.((error) => {
          console.error("Local track replacement rejected:", error);
        });
      }
    } else if (typeof peer.addTrack === "function") {
      peer.addTrack(track, stream);
    }
  }
  return true;
}

export function shouldCreateOffer(localId, remoteId) {
  if (typeof localId !== "string" || typeof remoteId !== "string" ||
      localId.length === 0 || remoteId.length === 0) return false;
  return localId.localeCompare(remoteId) < 0;
}
