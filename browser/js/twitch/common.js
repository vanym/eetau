'use strict';

const TWITCH_PATTERN = '*://*.twitch.tv/*';
const TWITCH_KRAKEN = 'https://api.twitch.tv/kraken';
const TWITCH_LINK = 'https://www.twitch.tv'
const TWITCH_CLIENT_ID = 'mcuge7d598c9v5v5r9e6u34iwem0vqb';
const TWITCH_FETCH_INIT = {headers: {'Client-ID': TWITCH_CLIENT_ID, 'Accept': 'application/vnd.twitchtv.v5+json'}};
