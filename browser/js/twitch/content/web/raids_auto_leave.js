'use strict';

import { observeSearchRoomSelector,
         observeSearchRaidBanner } from './twitch_objects.mjs';

function processRaidBanner(raidBanner){
    let leaveButton = raidBanner.querySelector('button.tw-core-button--secondary');
    if(leaveButton){
        leaveButton.click();
    }
}

function processRoomSelector(roomSelector){
    observeSearchRaidBanner(processRaidBanner, roomSelector);
}

function setup(){
    observeSearchRoomSelector(processRoomSelector);
}

setup();
