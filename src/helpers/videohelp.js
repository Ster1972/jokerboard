
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

