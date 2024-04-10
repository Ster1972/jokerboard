
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
                video: {width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 30, min: 15} },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    disableWebAudio: true
                }
            } );
        }

        else {
            throw new Error( 'User media not available' );
        }
    },

    replaceTrack( stream, recipientPeer ) {
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find( s => s.track && s.track.kind === stream.kind ) : false;

        sender ? sender.replaceTrack( stream ) : '';
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