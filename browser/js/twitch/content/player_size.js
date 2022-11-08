'use strict';

function fixSize(){
    let hash = window.location.hash;
    if(hash.startsWith('#')){
        hash = hash.substr(1);
    }
    if(hash){
        let hashParams = new URLSearchParams(hash);
        let width = parseInt(hashParams.get('width'));
        let height = parseInt(hashParams.get('height'));
        if(width && height){
            browser.runtime.sendMessage({
                type: 'window-resize-viewport',
                width: width,
                height: height
            });
            hashParams.delete('width');
            hashParams.delete('height');
            window.location.hash = hashParams.toString();
        }
    }
}

if(window.location.hostname == 'player.twitch.tv' || window.location.hostname == 'clips.twitch.tv'){
    fixSize();
}
