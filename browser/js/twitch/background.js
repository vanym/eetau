'use strict';

function getVideoMaxResolution(resolutions){
    let max = 0;
    let ret = null;
    for(let reso of Object.values(resolutions)){
        let reso_obj = {};
        let resop = reso.split('x');
        reso_obj.width = parseInt(resop[0]);
        reso_obj.height = parseInt(resop[1]);
        let mul = reso_obj.width * reso_obj.height;
        if(mul > max){
            max = mul;
            ret = reso_obj;
        }
    }
    if(ret != null){
        return ret;
    }
}

async function getTargetInfo(url, need_playable = true){
    let url_info = parseUrl(url);
    let target_info = {};
    if(url_info.paths[0] == 'videos'){
        let response = await fetch(TWITCH_KRAKEN + '/videos' + '/' + url_info.paths[1], TWITCH_FETCH_INIT);
        target_info.video = {};
        target_info.video.id = 'v' + url_info.paths[1];
        let time = url_info.searchParams.get('t');
        if(time){
            target_info.video.time = time;
        }
        if(response && response.status == 200){
            let response_json = await response.json();
            if(response_json){
                target_info.channel_name = response_json.channel.name;
                target_info.channel_id = parseInt(response_json.channel._id);
                target_info.video.id = response_json._id;
                target_info.video.resolution = getVideoMaxResolution(Object.values(response_json.resolutions));
            }
        }
    }else if(url_info.paths[1] == 'clip' || url_info.domains[2] == 'clips'){
        let slug;
        if(url_info.paths[1] == 'clip'){
            slug = url_info.paths[2];
        }else if(url_info.domains[2] == 'clips'){
            if(url_info.paths[0] == 'embed'){
                slug = url_info.searchParams.get('clip');
            }else{
                slug = url_info.paths[0];
            }
        }
        if(slug){
            let response = await fetch(TWITCH_KRAKEN + '/clips/' + slug, TWITCH_FETCH_INIT);
            if(response && response.status == 200){
                let response_json = await response.json();
                if(response_json){
                    target_info.clip = {};
                    target_info.clip.slug = response_json.slug;
                    target_info.channel_name = response_json.broadcaster.name;
                    target_info.channel_id = parseInt(response_json.broadcaster.id);
                    if(response_json.vod && need_playable){
                        let vod_target_info = await getTargetInfo(response_json.vod.url);
                        target_info.video = vod_target_info.video;
                    }
                }
            }
        }
    }else{
        target_info.channel_name = url_info.paths[0];
        if(need_playable){
            let response = await fetch(TWITCH_KRAKEN + '/users' + '?login=' + target_info.channel_name, TWITCH_FETCH_INIT);
            if(response && response.status == 200){
                let response_json = await response.json();
                if(response_json && response_json.users.length > 0){
                    let user = response_json.users[0];
                    target_info.channel_id = parseInt(user._id);
                }
                if(target_info.channel_id){
                    let response = await fetch(TWITCH_KRAKEN + '/streams' + '/' + target_info.channel_id, TWITCH_FETCH_INIT);
                    if(response && response.status == 200){
                        let response_json = await response.json();
                        if(response_json && response_json.stream){
                            target_info.stream = {};
                            target_info.stream.resolution = {};
                            target_info.stream.resolution.height = response_json.stream.video_height;
                            target_info.stream.resolution.width = response_json.stream.video_height * (16/9);
                            let stream_id = parseInt(response_json.stream._id);
                            let response = await fetch(TWITCH_KRAKEN + '/channels' + '/' + target_info.channel_id + '/videos' + '?limit=4&broadcast_type=archive', TWITCH_FETCH_INIT);
                            if(response && response.status == 200){
                                let response_json = await response.json();
                                if(response_json){
                                    for(let video of response_json.videos){
                                        if(video.broadcast_id == stream_id){
                                            let reso = getVideoMaxResolution(video.resolutions);
                                            if(reso){
                                                target_info.stream.resolution = reso;
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return target_info;
}

async function openChat(channel_name){
    const CONSTS = await import('./content/web/consts.mjs');
    let stor = (await new Promise(r => storage.local.get(CONSTS.DEFAULT_STORAGE.LOCAL, r)));
    let popout_chat = stor.settings.twitch.popout_chat;
    window.open('https://www.twitch.tv/popout/' + channel_name + '/chat?popout=', '_blank',
                'width=' + popout_chat.window_size.width + ',' + 
                'height=' + popout_chat.window_size.height + ',' + 
                (popout_chat.apply_window_position ? (
                'left=' + popout_chat.window_position.left + ',' + 
                'top='  + popout_chat.window_position.top  + ',' + 
                '') : '') + 
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

async function openPlayer(target_info){
    const CONSTS = await import('./content/web/consts.mjs');
    let stor = (await new Promise(r => storage.local.get(CONSTS.DEFAULT_STORAGE.LOCAL, r)));
    let url = new URL('https://player.twitch.tv/');
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
    window.open(url.toString(), '_blank',
                'width='  + (resolution.width  + offset.x) + ',' + 
                'height=' + (resolution.height + offset.y) + ',' + 
                (stor.settings.twitch.popout_player.apply_window_position ? (
                'left=' + stor.settings.twitch.popout_player.window_position.left + ',' + 
                'top='  + stor.settings.twitch.popout_player.window_position.top  + ',' + 
                '') : '') + 
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

async function windowResizeViewport(width, height, tab){
    const CONSTS = await import('./content/web/consts.mjs');
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
        if(target_info.channel_name){
            await openPlayer(target_info);
        }
    }
    if(menu_item_id == 'popout-open-player-chat'){
        let target_info = await getTargetInfo(info.linkUrl);
        if(target_info.channel_name){
            await openPlayer(target_info);
            await openChat(target_info.channel_name);
        }
    }
}

function onInstalled(details){
    browser.contextMenus.create({
        'id': 'popout-open',
        'title': 'Open Popout',
        'contexts': ['link'],
        'targetUrlPatterns': [TWITCH_PATTERN]
    });
    browser.contextMenus.create({
        'id': 'popout-open-player-chat',
        'title': 'Open Player Chat',
        'contexts': ['link'],
        'parentId': 'popout-open',
        'targetUrlPatterns': [TWITCH_PATTERN]
    });
    browser.contextMenus.create({
        'id': 'popout-open-player',
        'title': 'Open Player',
        'contexts': ['link'],
        'parentId': 'popout-open',
        'targetUrlPatterns': [TWITCH_PATTERN]
    });
    browser.contextMenus.create({
        'id': 'popout-open-chat',
        'title': 'Open Chat',
        'contexts': ['link'],
        'parentId': 'popout-open',
        'targetUrlPatterns': [TWITCH_PATTERN]
    });
}

browser.runtime.onInstalled.addListener(onInstalled);
browser.contextMenus.onClicked.addListener(onClicked);
browser.extension.onMessage.addListener(onMessage);
