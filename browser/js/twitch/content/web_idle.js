'use strict';

async function injectScripts(){
    const CONSTS = await import('./web/consts.mjs');
    if(CONSTS.DEV_MODE){
        injectDevScript();
    }
    let stor_sync = (await new Promise(r => storage.sync.get(CONSTS.DEFAULT_STORAGE.SYNC, r)));
    let show_video_playback = stor_sync.settings.twitch.chat.show_video_playback;
    if(show_video_playback){
        injectModuleScript(browser.runtime.getURL(WEB_DIR + '/video_playback.mjs'));
    }
    let custom_timestamps = stor_sync.settings.twitch.chat.custom_timestamps;
    if(custom_timestamps){
        const CLASS_CHAT_LINE_TIMESTAMP = CONSTS.EXTENSION_CLASS_PREFIX + '-chat-line-timestamp';
        const CLASS_CHAT_LINE_TIMESTAMP_SCRIPT = CLASS_CHAT_LINE_TIMESTAMP + '-script';
        let script = document.createElement('script');
        script.setAttribute('type', 'module');
        script.id = CLASS_CHAT_LINE_TIMESTAMP_SCRIPT;
        script.setAttribute('settings', JSON.stringify(stor_sync.settings.twitch.chat.custom_timestamps_settings));
        script.setAttribute('src', browser.runtime.getURL(WEB_DIR + '/timestamps.mjs'));
        document.head.appendChild(script);
    }
    let player_controls = stor_sync.settings.twitch.player.controls;
    if(player_controls){
        const CLASS_PLAYER_CONTROLS = CONSTS.EXTENSION_CLASS_PREFIX + '-player-controls';
        const CLASS_PLAYER_CONTROLS_SCRIPT = CLASS_PLAYER_CONTROLS + '-script';
        let script = document.createElement('script');
        script.setAttribute('type', 'module');
        script.id = CLASS_PLAYER_CONTROLS_SCRIPT;
        script.setAttribute('settings', JSON.stringify(stor_sync.settings.twitch.player.controls_settings));
        script.setAttribute('src', browser.runtime.getURL(WEB_DIR + '/player_controls.mjs'));
        document.head.appendChild(script);
    }
    let auto_claim_points = stor_sync.settings.twitch.chat.community_points_settings.auto_claim_bonus;
    if(auto_claim_points){
        injectModuleScript(browser.runtime.getURL(WEB_DIR + '/community_points_auto_claim.mjs'));
    }
    let auto_leave_raids = stor_sync.settings.twitch.chat.auto_leave_raids;
    if(auto_leave_raids){
        injectModuleScript(browser.runtime.getURL(WEB_DIR + '/raids_auto_leave.mjs'));
    }
    let chatlog_loader = stor_sync.settings.twitch.chat.chatlog_loader;
    if(chatlog_loader){
        const CLASS_CHATLOG_LOADER = CONSTS.EXTENSION_CLASS_PREFIX + '-chatlog-loader';
        const CLASS_CHATLOG_LOADER_SCRIPT = CLASS_CHATLOG_LOADER + '-script';
        let script = document.createElement('script');
        script.setAttribute('type', 'module');
        script.id = CLASS_CHATLOG_LOADER_SCRIPT;
        script.setAttribute('settings', JSON.stringify(stor_sync.settings.twitch.chat.chatlog_loader_settings));
        script.setAttribute('src', browser.runtime.getURL(WEB_DIR + '/chatlog_loader.mjs'));
        document.head.appendChild(script);
    }
}

injectScripts();
