'use strict';

async function titleChange(){
    const CONSTS = await import('./web/consts.mjs');
    let stor = (await new Promise(r => storage.sync.get(CONSTS.DEFAULT_STORAGE.SYNC, r)));
    let change_title_chat = stor.settings.twitch.popout_chat.change_title;
    let new_title_chat = stor.settings.twitch.popout_chat.title;
    let add_channel_link = stor.settings.twitch.popout_chat.add_channel_link;
    let change_title_player = stor.settings.twitch.popout_player.change_title;
    let new_title_player_channel = stor.settings.twitch.popout_player.title_channel;
    let new_title_player_video = stor.settings.twitch.popout_player.title_video;
    let url = parseUrl(document.location);
    if(url.paths[0] == 'popout' && url.paths[2] == 'chat'){
        let channel_name = url.paths[1];
        if(change_title_chat){
            document.title = new_title_chat.replace(/%title%/g, document.title).replace(/%channel%/g, channel_name);
        }
        if(add_channel_link){
            let trys = CONSTS.PAGE_LOAD_TIMEOUT / 1000;
            function tryAddChannelLink(){
                let rooms_header = document.querySelector('.stream-chat-header');
                if(rooms_header){
                    let room_selector = rooms_header.firstChild;
                    room_selector.style.position = 'absolute';
                    room_selector.style.left = '0px';
                    room_selector.style.marginLeft = '1rem';
                    let a = document.createElement('a');
                    a.id = 'channel-link';
                    a.href = CONSTS.TWITCH_LINK + '/' + channel_name;
                    a.text = channel_name;
                    a.target = '_blank';
                    a.style.textDecoration = 'none';
                    a.style.color = '#322f37';
                    a.style.fontSize = '115%';
                    rooms_header.insertBefore(a, rooms_header.lastChild);
                }else{
                    if(trys > 0){
                        trys -= 1;
                        setTimeout(tryAddChannelLink, 1000);
                    }
                }
            }
            tryAddChannelLink();
        }
    }
    if(change_title_player && url.hostname == 'player.twitch.tv'){
        let channel_name = url.searchParams.get('channel');
        let video_id = url.searchParams.get('video');
        if(channel_name){
            document.title = new_title_player_channel.replace(/%title%/g, document.title).replace(/%channel%/g, channel_name);
        }
        if(video_id){
            document.title = new_title_player_video.replace(/%title%/g, document.title).replace(/%video_id%/g, video_id);
        }
    }
}

titleChange();
