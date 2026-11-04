
export default {
    closeVideo( elemId ) {
        if ( document.getElementById( elemId ) ) {
            document.getElementById( elemId ).remove();
        }
    },


    userMediaAvailable() {
        return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function");
    },


    getUserFullMedia() {
        console.log('camera available',this.userMediaAvailable())
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getUserMedia( {
                video: {
                    width: { ideal: 960 },
                    height: { ideal: 540 },
                    frameRate: { ideal: 24, max: 30, min: 15 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            } );
        }

        else {
            throw new Error( 'User media not available' );
        }
    },

    replaceTrack( stream, recipientPeer ) {
        if (!stream || !recipientPeer?.getSenders) return;

        const sender = recipientPeer.getSenders().find((item) =>
            item.track && item.track.kind === stream.kind
        );

        if (sender) sender.replaceTrack(stream);
    },
    
    
    stopStream( stream ) {
        if (!stream?.getTracks) return;
        for (const track of stream.getTracks()) {
            track.stop();
        }
    },


    toggleVideoBtnDisabled( disabled ) {
        document.getElementById( 'toggle-video' ).disabled = disabled;
    },


    maximiseStream( e ) {
        let elem = e.target.parentElement.previousElementSibling;

        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    },


    setLocalStream( stream, mirrorMode = true ) {
        const localVidElem = document.getElementById( 'local' );

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add( 'mirror-mode' ) : localVidElem.classList.remove( 'mirror-mode' );
    }

};