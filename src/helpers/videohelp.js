
export default {
    closeVideo(elemId) {
        const element = document.getElementById(elemId);
        if (element) {
            element.remove();
        }
    },

    userMediaAvailable() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    async getUserFullMedia() {
        if (this.userMediaAvailable()) {
            try {
                return await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, min: 15 } },
                    audio: { echoCancellation: true, noiseSuppression: true, disableWebAudio: true }
                });
            } catch (error) {
                throw new Error('Error getting user media stream: ' + error);
            }
        } else {
            throw new Error('User media not available');
        }
    },

    getIceServer() {
        return {
            iceservers: [
                {urls: "stun:stun.l.google.com:19302",},
                {urls: "stun:stun1.l.google.com:19302",},
                {urls: "stun:stun2.l.google.com:19302",},
                {urls: "stun:stun3.l.google.com:19302",},
                {urls: "stun:stun4.l.google.com:19302",},
            ]
        }

    },

    // getIceServer() {
    //     return {
    //         iceServers: [
    //             {
    //                 urls: ["stun:us-turn12.xirsys.com"]
    //             },
    //             {
    //                 username: "n8k7T74KxBy_BoK6SeLI4DBDbRI2E1NMg14iKZK4K6WPA0zD-Mcs4Yzc4B66N9JeAAAAAGCgXB1zdHJlZXRlcmI=",
    //                 credential: "a71eec68-3191-11ee-88c1-0242ac150006",
    //                 urls: [
    //                     "turn:us-turn12.xirsys.com:80?transport=udp",
    //                     "turn:us-turn12.xirsys.com:3478?transport=udp",
    //                     "turn:us-turn12.xirsys.com:80?transport=tcp",
    //                     "turn:us-turn12.xirsys.com:3478?transport=tcp",
    //                     "turns:us-turn12.xirsys.com:443?transport=tcp",
    //                     "turns:us-turn12.xirsys.com:5349?transport=tcp",
    //                     "stun:stun.l.google.com:19302",
    //                     "stun:stun1.l.google.com:19302",
    //                     "stun:stun2.l.google.com:19302",
    //                     "stun:stun3.l.google.com:19302",
    //                     "stun:stun4.l.google.com:19302"
    //                 ]
    //             }
    //         ]
    //     };
    //},

    replaceTrack(stream, recipientPeer) {
        const sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : null;
        if (sender) {
            sender.replaceTrack(stream);
        }
    },

    toggleVideoBtnDisabled(disabled) {
        const toggleVideoBtn = document.getElementById('toggle-video');
        if (toggleVideoBtn) {
            toggleVideoBtn.disabled = disabled;
        }
    },

    maximiseStream(e) {
        const elem = e.target.parentElement.previousElementSibling;
        elem.requestFullscreen && elem.requestFullscreen();
        elem.mozRequestFullScreen && elem.mozRequestFullScreen();
        elem.webkitRequestFullscreen && elem.webkitRequestFullscreen();
        elem.msRequestFullscreen && elem.msRequestFullscreen();
    },

    setLocalStream(stream, mirrorMode = true) {
        const localVidElem = document.getElementById('local');
        if (localVidElem) {
            localVidElem.srcObject = stream;
            mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
        } else {
            console.error('Local video element not found.');
        }
    }
};

