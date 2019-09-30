'use strict';

import { PAGE_LOAD_TIMEOUT } from './consts.mjs';
import { getChatController,
         getChatControllerFromRoomSelector,
         sendChatAdminMessage,
         sendNotifyMessage,
         getPubsub, 
         observeSearchRoomSelector } from './twitch_objects.mjs';

const TWITCH_PUBSUB_VIDEO_PLAYBACK_TOPIC = 'video-playback-by-id';

function waitGet(f, r, trys=(PAGE_LOAD_TIMEOUT / 100)){
    let d = f();
    if(d){
        r(d);
    }else{
        if(trys <= 0){
            r();
        }
        setTimeout(() => {
            waitGet(f, r, trys - 1);
        }, 100);
    }
}

function waitGetPromise(f, trys=undefined){
    return new Promise(r => {waitGet(f, r, trys)});
}

function waitGetPubsub(){
    return waitGetPromise(getPubsub);
}

let pubsubprod;

let channel_change_timeout = 1000;

class ChannelInfo{
    constructor(){
        this.chats = new Set();
        this.listening = false;
    }
    getID(){
        for(let chat of this.chats){
            if(chat.props.channelID){
                return chat.props.channelID;
            }
        }
        return;
    }
    getName(){
        for(let chat of this.chats){
            if(chat.props.channelLogin){
                return chat.props.channelLogin;
            }
        }
        return;
    }
    success(){
        //console.log('video-playback pubsub listener success' + ' ' + this.name);
    }
    failure(){
        console.log('video-playback pubsub listener failure' + ' ' + this.name);
    }
    message(e){
        let event = JSON.parse(e);
        let mes;
        if(event.type == 'stream-up'){
            mes = 'Stream up';
        }
        if(event.type == 'stream-down'){
            mes = 'Stream down';
        }
        if(mes){
            for(let chat of this.chats){
                sendNotifyMessage(mes, chat);
            }
        }
    }
    listen(){
        this.name = this.getName();
        this.id = this.getID();
        this.listen_args = {
            topic: TWITCH_PUBSUB_VIDEO_PLAYBACK_TOPIC + '.' + this.id,
            success: this.success.bind(this),
            failure: this.failure.bind(this),
            message: this.message.bind(this)
        };
        this.listening = true;
        pubsubprod.Listen(this.listen_args);
    }
    unlisten(){
        this.listening = false;
        pubsubprod.Unlisten(this.listen_args);
        pubsubprod.Unlisten(this.listen_args);
    }
    add(chat){
        this.chats.add(chat);
        clearTimeout(this.remove_timeout_id);
        if(this.listening == false){
            this.add_timeout_id = setTimeout(this.addTimeout.bind(this), channel_change_timeout);
        }
    }
    addTimeout(){
        if(this.chats.size > 0 && this.listening == false){
            if(this.getID()){
                this.listen();
            }
        }
    }
    remove(chat){
        this.chats.delete(chat);
        if(this.chats.size < 1){
            clearTimeout(this.add_timeout_id);
            if(this.listening){
                this.remove_timeout_id = setTimeout(this.removeTimeout.bind(this), channel_change_timeout);
            }
        }
    }
    removeTimeout(){
        clearTimeout(this.remove_timeout_id);
        if(this.chats.size < 1 && this.listening){
            this.unlisten();
        }
    }
}

let channels = {};

function processChatController(chat){
    let login = chat.props.channelLogin;
    if(!channels[login]){
        channels[login] = new ChannelInfo();
    }
    channels[login].add(chat);
}

function processChatControllerLost(chat){
    let login = chat.props.channelLogin;
    if(channels[login]){
        channels[login].remove(chat);
    }
}

function processRoomSelector(ele){
    let chat = getChatControllerFromRoomSelector(ele);
    if(chat){
        processChatController(chat);
    }
}

function processRoomSelectorLost(ele){
    let chat = getChatControllerFromRoomSelector(ele);
    if(chat){
        processChatControllerLost(chat);
    }
}

async function setup(){
    pubsubprod = await waitGetPubsub();
    if(pubsubprod){
        observeSearchRoomSelector(processRoomSelector, processRoomSelectorLost);
    }
}

setup();
