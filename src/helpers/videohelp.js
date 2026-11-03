
export default {
    closeVideo( elemId ) {
        if ( document.getElementById( elemId ) ) {
            document.getElementById( elemId ).remove();
        }
    },


    userMediaAvailable() {
        return !!( navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true, audio: true}) ); // returns a true or false
    },


    getUserFullMedia() {
        console.log('camera available',this.userMediaAvailable())
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getUserMedia( {
                video: {
                    width: { exact: 640 },
                    height: { exact: 480 },
                    frameRate: { exact: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            } ).catch(() => navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }));
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