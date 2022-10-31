'use strict';

import * as CONSTS from './consts.mjs';
import { getApolloClient,
         getChatListPresentation,
         getGqlQueryMessageBufferChatHistory,
         getGqlQueryMessageBufferChatHistoryRenderer,
         observeSearchRoomSelector,
         waitGet } from './twitch_objects.mjs';
import { getSettings } from './common.mjs';

const CLASS_CHATLOG_LOADER = CONSTS.EXTENSION_CLASS_PREFIX + '-chatlog-loader';
const CLASS_CHATLOG_LOADER_SCRIPT = CLASS_CHATLOG_LOADER + '-script';

const settings = getSettings(CLASS_CHATLOG_LOADER_SCRIPT, CONSTS.DEFAULT_SETTINGS.CHATLOG_LOADER_SETTINGS);

function guard(ele, name){
    let g = '__' + CONSTS.EXTENSION_VAR_PREFIX + '_' + 'chatlog_loader' + '_' + name;
    if(ele[g]){
        return true;
    }else{
        ele[g] = true;
        return false;
    }
}

function addMessage(buffer, message){
    if(buffer.find(m => (m.id == message.id)) !== undefined){
        return false;
    }
    let i = buffer.findIndex(m => !(m.timestamp < message.timestamp));
    if(i != -1){
        buffer.splice(i, 0, message);
    }else{
        buffer.push(message);
    }
    return true;
}

function patchChatListPrependHistoricalMessages(chatList){
    if(guard(chatList, "prepend_historical_messages_patch")){
        return;
    }
    let originalPrependHistoricalMessages = chatList.prependHistoricalMessages;
    chatList.prependHistoricalMessages = function(...args){
        let originalBuffer = this.buffer;
        Object.defineProperty(this, "buffer", {
            set: function(messages){
                for(const message of messages){
                    addMessage(originalBuffer, message);
                }
            },
            get: function(){
                return []; // returning empty to always pass size check
            }
        });
        let ret = originalPrependHistoricalMessages.bind(this)(...args);
        Object.defineProperty(this, "buffer", {value: originalBuffer});
        return ret;
    }
}

function patchChatListFillHistoricalMessages(chatList){
    if(guard(chatList, "fill_historical_messages")){
        return;
    }
    chatList.fillHistoricalMessages = function(messages){
        let oldHistoricalMessages = chatList.props.historicalMessages;
        chatList.props.historicalMessages = messages;
        return chatList.prependHistoricalMessages(oldHistoricalMessages);
    }
}

function processChatList(chatList, apolloClient, queryMessageBufferChatHistory){
    patchChatListPrependHistoricalMessages(chatList);
    patchChatListFillHistoricalMessages(chatList);
    async function requestMessageBufferChatHistory(){
        let resp = await apolloClient.query(
            {
                query: queryMessageBufferChatHistory,
                variables: {channelLogin: chatList.props.channelLogin},
                fetchPolicy: 'network-only',
            }
        );
        return resp?.data?.channel?.recentChatMessages;
    }
    async function updateHistoricalMessages(){
        let messages = await requestMessageBufferChatHistory();
        if(messages){
            chatList.fillHistoricalMessages(messages);
        }
    }
    updateHistoricalMessages();
    if(!guard(chatList.props.messageHandlerAPI, 'on_connected_update')){
        chatList.props.messageHandlerAPI.addMessageHandler(function(e){
            if(e.type == 11 /*connected*/){
                updateHistoricalMessages();
            }
        });
    }
}

function patchQueryRenderer(renderer){
    if(guard(renderer, 'condition_patch')){
        return;
    }
    let originalRender = renderer.render;
    renderer.render = function(...args){
        if(this.props){
            this.props.isLoggedIn = true;
            this.props.isCurrentUserModerator = true;
        }
        return originalRender.bind(this)(...args);
    }
}

async function processRoomSelector(ele){
    let renderer = getGqlQueryMessageBufferChatHistoryRenderer(ele);
    if(renderer){
        patchQueryRenderer(renderer);
    }
    let apolloClient = getApolloClient();
    let chatList = getChatListPresentation(ele);
    let queryMessageBufferChatHistory =
        getGqlQueryMessageBufferChatHistory(ele);
    if(apolloClient && chatList && queryMessageBufferChatHistory){
        processChatList(chatList, apolloClient, queryMessageBufferChatHistory);
    }
}

async function setup(){
    observeSearchRoomSelector(processRoomSelector);
}

setup();
