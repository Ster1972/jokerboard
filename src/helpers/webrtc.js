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

  const tracks = [...stream.getTracks()].sort((left, right) =>
    left.kind === "audio" ? -1 : right.kind === "audio" ? 1 : 0
  );
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

export function canCreateOffer(peer) {
  return Boolean(
    peer?.__shouldOffer &&
    peer.signalingState === "stable" &&
    !peer.__offerPending
  );
}

export function getBrowserWebRtcCapabilities() {
  return {
    peerConnection: typeof globalThis.RTCPeerConnection === "function",
    sessionDescription: typeof globalThis.RTCSessionDescription === "function",
    iceCandidate: typeof globalThis.RTCIceCandidate === "function",
    addTransceiver: typeof globalThis.RTCRtpTransceiver === "function",
    senderCapabilities: typeof globalThis.RTCRtpSender?.getCapabilities === "function",
    videoPlayback: typeof globalThis.document?.createElement === "function"
  };
}

export function validateIceServerConfig(config) {
  if (!config || !Array.isArray(config.iceServers)) {
    return { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };
  }

  const iceServers = config.iceServers.map((server) => {
    const urls = Array.isArray(server?.urls) ? server.urls : [server?.urls];
    const validUrls = urls.filter((url) =>
      typeof url === "string" &&
      /^(stun|turn|turns):/i.test(url.trim())
    );
    if (!validUrls.length) return null;
    const cleaned = { urls: validUrls };
    if (typeof server.username === "string") cleaned.username = server.username;
    if (typeof server.credential === "string") cleaned.credential = server.credential;
    return cleaned;
  }).filter(Boolean);

  if (!iceServers.length) {
    return { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };
  }
  return { iceServers };
}

export function configureCodecPreferences(peer, preferredCodecs = ["vp8", "h264", "vp9"]) {
  if (!peer?.getTransceivers || !globalThis.RTCRtpSender?.getCapabilities) return 0;

  const capabilities = RTCRtpSender.getCapabilities("video");
  if (!capabilities?.codecs?.length) return 0;

  let preferred = [];
  for (const name of preferredCodecs) {
    for (const codec of capabilities.codecs) {
      const codecName = (codec.mimeType || "").toLowerCase();
      if (codecName.includes(name) && !preferred.includes(codec)) preferred.push(codec);
    }
  }
  for (const codec of capabilities.codecs) {
    if (!preferred.includes(codec)) preferred.push(codec);
  }

  let updated = 0;
  for (const transceiver of peer.getTransceivers()) {
    const kind = transceiver.receiver?.track?.kind || transceiver.sender?.track?.kind;
    if (kind === "video" && typeof transceiver.setCodecPreferences === "function") {
      transceiver.setCodecPreferences(preferred);
      updated++;
    }
  }
  return updated;
}
