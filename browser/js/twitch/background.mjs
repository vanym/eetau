'use strict';

import * as CONSTS from './content/web/consts.mjs';
import { parseUrl } from './content/web/common.mjs';

const browser = chrome;
const storage = chrome.storage;

async function getTargetInfo(url){
    let url_info = parseUrl(url);
    let target_info = {};
    if(url_info.paths[0] == 'videos'){
        target_info.video = {};
        target_info.video.id = 'v' + url_info.paths[1];
        let time = url_info.searchParams.get('t');
        if(time){
            target_info.video.time = time;
        }
    }else if(url_info.paths[1] == 'clip' || url_info.domains[2] == 'clips'){
        target_info.clip = {};
        if(url_info.paths[1] == 'clip'){
            target_info.clip.slug = url_info.paths[2];
            target_info.channel_name = url_info.paths[0]?.toLowerCase();
        }else if(url_info.domains[2] == 'clips'){
            if(url_info.paths[0] == 'embed'){
                target_info.clip.slug = url_info.searchParams.get('clip');
            }else{
                target_info.clip.slug = url_info.paths[0];
            }
        }
    }else{
        target_info.channel_name = url_info.paths[0];
    }
    return target_info;
}

function createWindow(create_data, popout_using_windows_api=true){
    if(popout_using_windows_api){
        browser.windows.create(create_data);
    }else{
        window.open(create_data.url, '_blank',
                    'width='  + create_data.width + ',' +
                    'height=' + create_data.height + ',' +
                    (create_data.left !== undefined ? ('left=' + create_data.left + ',') : '') +
                    (create_data.top  !== undefined ? ('top='  + create_data.top  + ',') : '') +
                    'resizable=yes' + ',' +
                    'scrollbars=no' + ',' +
                    'toolbar=no' + ',' +
                    'location=no' + ',' +
                    'directories=no' + ',' +
                    'status=no' + ',' +
                    'menubar=no' + ',' +
                    'titlebar=no' + ',' +
                    'copyhistory=no');
    }
}

async function openChat(channel_name){
    let stor = (await new Promise(r => storage.local.get(CONSTS.DEFAULT_STORAGE.LOCAL, r)));
    let popout_chat = stor.settings.twitch.popout_chat;
    let create_data = {
        url:  'https://www.twitch.tv/popout/' + channel_name + '/chat?popout=',
        type: 'popup'
    };
    create_data.width  = popout_chat.window_size.width;
    create_data.height = popout_chat.window_size.height;
    if(popout_chat.apply_window_position){
        create_data.left = popout_chat.window_position.left;
        create_data.top  = popout_chat.window_position.top;
    }
    createWindow(create_data, stor.settings.twitch.popout_using_windows_api);
}

async function openPlayer(target_info){
    let stor = (await new Promise(r => storage.local.get(CONSTS.DEFAULT_STORAGE.LOCAL, r)));
    let url = new URL('https://player.twitch.tv/');
    url.searchParams.append('parent', 'twitch.tv');
    if(stor.settings.twitch.popout_player.apply_volume){
        url.searchParams.append('volume', String(stor.settings.twitch.popout_player.volume));
    }
    let resolution;
    if(target_info.clip){
        url.hostname = 'clips.twitch.tv';
        url.pathname = 'embed';
        url.searchParams.append('clip', target_info.clip.slug);
        if(target_info.video && target_info.video.resolution){
            resolution = target_info.video.resolution;
        }
    }else if(target_info.video){
        url.searchParams.append('video', target_info.video.id);
        if(target_info.video.time){
            url.searchParams.append('time', target_info.video.time);
        }
        if(target_info.video.resolution){
            resolution = target_info.video.resolution;
        }
    }else{
        url.searchParams.append('channel', target_info.channel_name);
        if(target_info.stream && target_info.stream.resolution){
            resolution = target_info.stream.resolution;
        }
    }
    if(!resolution || stor.settings.twitch.popout_player.fixed_size){
        resolution = stor.settings.twitch.popout_player.default_resolution;
    }
    let offset = stor.cache.viewport_size_offset;
    let hashParams = new URLSearchParams();
    hashParams.append('width', resolution.width);
    hashParams.append('height', resolution.height);
    url.hash = hashParams.toString();
    let create_data = {
        url:  url.toString(),
        type: 'popup'
    };
    create_data.width  = (resolution.width  + offset.x);
    create_data.height = (resolution.height + offset.y);
    if(stor.settings.twitch.popout_player.apply_window_position){
        create_data.left = stor.settings.twitch.popout_player.window_position.left;
        create_data.top  = stor.settings.twitch.popout_player.window_position.top;
    }
    createWindow(create_data, stor.settings.twitch.popout_using_windows_api);
}

async function windowResizeViewport(width, height, tab){
    let win = (await new Promise(r => browser.windows.get(tab.windowId, r)));
    let offset = {
        x: (win.width  - tab.width ),
        y: (win.height - tab.height)
    };
    let update = {};
    if(width){
        update['width']  = width  + offset.x;
    }
    if(height){
        update['height'] = height + offset.y;
    }
    (await new Promise(r => browser.windows.update(win.id, update, r)));
    let stor = (await new Promise(r => storage.local.get(CONSTS.DEFAULT_STORAGE.LOCAL, r)));
    if(stor.cache.viewport_size_offset.x != offset.x
    || stor.cache.viewport_size_offset.y != offset.y
    ){
        (await new Promise(r => storage.local.set({cache: {viewport_size_offset: offset}}, r)));
    }
}

function onMessage(body, sender){
    switch(body.type){
        case 'window-resize-viewport':
            windowResizeViewport(body.width, body.height, sender.tab);
        break;
    }
}

async function onClicked(info, tab){
    let menu_item_id = info['menuItemId'];
    if(menu_item_id == 'popout-open-chat'){
        let target_info = await getTargetInfo(info.linkUrl, false);
        if(target_info.channel_name){
            await openChat(target_info.channel_name);
        }
    }
    if(menu_item_id == 'popout-open-player'){
        let target_info = await getTargetInfo(info.linkUrl);
        await openPlayer(target_info);
    }
    if(menu_item_id == 'popout-open-player-chat'){
        let target_info = await getTargetInfo(info.linkUrl);
        await openPlayer(target_info);
        if(target_info.channel_name){
            await openChat(target_info.channel_name);
        }
    }
}

async function createContextMenus(){
    let root_menu_id = browser.contextMenus.create({
        'id': 'popout-open',
        'title': 'Open Popout',
        'contexts': ['link'],
        'targetUrlPatterns': [CONSTS.TWITCH_PATTERN]
    });
    browser.contextMenus.create({
        'id': 'popout-open-player-chat',
        'title': 'Open Player Chat',
        'contexts': ['link'],
        'parentId': root_menu_id,
        'targetUrlPatterns': [CONSTS.TWITCH_PATTERN]
    });
    browser.contextMenus.create({
        'id': 'popout-open-player',
        'title': 'Open Player',
        'contexts': ['link'],
        'parentId': root_menu_id,
        'targetUrlPatterns': [CONSTS.TWITCH_PATTERN]
    });
    browser.contextMenus.create({
        'id': 'popout-open-chat',
        'title': 'Open Chat',
        'contexts': ['link'],
        'parentId': root_menu_id,
        'targetUrlPatterns': [CONSTS.TWITCH_PATTERN]
    });
}

async function onInstalled(details){
    await createContextMenus();
}

browser.runtime.onInstalled.addListener(onInstalled);
browser.contextMenus.onClicked.addListener(onClicked);
browser.runtime.onMessage.addListener(onMessage);
