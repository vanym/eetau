'use strict';

import { observeSearchRoomSelector,
         observeSearchRaidBanner } from './twitch_objects.mjs';

function processRaidBanner(raidBanner){
    let leaveButton = raidBanner.querySelector('button[class*="tw-core-button"]');
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
