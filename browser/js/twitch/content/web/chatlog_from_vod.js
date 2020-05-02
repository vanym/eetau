'use strict';

import * as CONSTS from './consts.mjs';
import { getChatController,
         getChatControllerFromRoomSelector,
         getChatListPresentation,
         getChatBufferController,
         observeSearchRoomSelector,
         waitGet } from './twitch_objects.mjs';
import { getSettings } from './common.mjs';

const CLASS_CHATLOG_FROM_VOD = CONSTS.EXTENSION_CLASS_PREFIX + '-chatlog-from-vod';
const CLASS_CHATLOG_FROM_VOD_SCRIPT = CLASS_CHATLOG_FROM_VOD + '-script';

const settings = getSettings(CLASS_CHATLOG_FROM_VOD_SCRIPT, CONSTS.DEFAULT_SETTINGS.CHATLOG_FROM_VOD_SETTINGS);

function getMessageByComment(comment){
    let message = {};
    message.badges = {};
    if(comment.message.user_badges){
        for(let badge of comment.message.user_badges){
            message.badges[badge._id] = badge.version;
        }
    }
    message.id = comment._id;
    message.timestamp = (new Date(comment.created_at)).getTime();
    message.user = {};
    message.user.color = comment.message.user_color;
    message.user.userDisplayName = comment.commenter.display_name;
    message.user.userLogin = comment.commenter.name;
    message.user.userID = comment.commenter._id;
    message.messageParts = [{type: 0, content: comment.message.body}];
    message.messageType = 0;
    message.type = 0;
    return message;
}

async function getStreamVideo(channel_id){
    let promise_streams = fetch(CONSTS.TWITCH_KRAKEN + '/streams' + '/' + channel_id + '?stream_type=live', CONSTS.TWITCH_FETCH_INIT);
    let promise_videos = fetch(CONSTS.TWITCH_KRAKEN + '/channels' + '/' + channel_id + '/videos' + '?limit=4&broadcast_type=archive', CONSTS.TWITCH_FETCH_INIT);
    let response_streams = await promise_streams;
    let response_videos = await promise_videos;
    if(response_streams && response_streams.status == 200
    && response_videos  && response_videos.status  == 200){
        let response_streams_json = await response_streams.json();
        let response_videos_json = await response_videos.json();
        if(response_streams_json && response_streams_json.stream && response_videos_json){
            let stream_id = parseInt(response_streams_json.stream._id);
            for(let video of response_videos_json.videos){
                if(video.broadcast_id == stream_id){
                    return video;
                }
            }
        }
    }
}

function addMessage(chatList, message){
    if(chatList.buffer.find(m => (m.id == message.id)) !== undefined){
        return false;
    }
    let i = chatList.buffer.findIndex(m => !(m.timestamp < message.timestamp));
    chatList.buffer.splice(i, 0, message);
    return true;
}

function processMessages(chatList, messages){
    for(let message of messages){
        addMessage(chatList, message);
    }
    chatList.notifySubscribers();
}

async function processChatController(chat, chatList){
    let channel_id = await waitGet(() => chat.props.channelID);
    if(channel_id === undefined){
        return;
    }
    let video = await getStreamVideo(channel_id);
    if(video === undefined){
        return;
    }
    let video_id = parseInt(video._id.substr(1));
    let start_date = new Date(video.recorded_at);
    let now_date = new Date();
    let offset = Math.floor((now_date - start_date) / 1000);
    let url = new URL('https://api.twitch.tv/v5/videos/' + video_id + '/comments');
    url.searchParams.set('content_offset_seconds', offset);
    for(let count = 0; count < settings.messages_amount;){
        let response = await fetch(url.toString(), CONSTS.TWITCH_FETCH_INIT);
        if(response && response.status == 200){
            let response_json = await response.json();
            let messages = [];
            for(let i = (response_json.comments.length - 1); i >= 0 && count < settings.messages_amount; --i){
                let comment = response_json.comments[i];
                messages.push(getMessageByComment(comment));
                ++count;
            }
            processMessages(chatList, messages);
            if(response_json._prev){
                url.search = '';
                url.searchParams.set('cursor', response_json._prev);
            }else{
                break;
            }
        }else{
            break;
        }
    }
}

async function processRoomSelector(ele){
    let chat = getChatControllerFromRoomSelector(ele);
    let chatList = getChatListPresentation(ele);
    if(chat && chatList){
        processChatController(chat, chatList);
    }
}

async function setup(){
    observeSearchRoomSelector(processRoomSelector);
}

setup();
