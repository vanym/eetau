'use strict';

import { observeSearchCommunityPointsSummary,
         observeGetCommunityPointsSummaryClaimButton } from './twitch_objects.mjs';

function processClaimButton(claimButton){
    claimButton.click();
}

function processCommunityPointsSummary(communityPointsSummary){
    observeGetCommunityPointsSummaryClaimButton(processClaimButton, communityPointsSummary);
}

function setup(){
    observeSearchCommunityPointsSummary(processCommunityPointsSummary);
}

setup();
