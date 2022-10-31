'use strict'; // based on https://github.com/night/BetterTTV/blob/master/src/utils/twitch.js

import * as CONSTS from './consts.mjs';

const REACT_ROOT = '#root div';
const CHANNEL_CONTAINER = '.channel-page,.channel-root';
const CHAT_CONTAINER = 'section[data-test-selector="chat-room-component-layout"]';
const ROOM_SELECTOR = '.stream-chat';
const VOD_CHAT_CONTAINER = '.qa-vod-chat';
const CHAT_LIST = '.chat-list';
const MEDIA_PLAYER_ROOT = '.video-player';
const CLIPS_BROADCASTER_INFO = '.clips-broadcaster-info';
const TWITCH_LOG_SELECTOR = 'div[role="log"]';
const COMMUNITY_POINTS_SUMMARY = '.community-points-summary';
const COMMUNITY_POINTS_SUMMARY_CLAIM_BUTTON = '.claimable-bonus__icon';
const RAID_BANNER = 'div[data-test-selector="raid-banner"]';

function getReactInstance(element){
    for(const key in element){
        if(key.startsWith('__reactInternalInstance$')){
            return element[key];
        }
    }
    return null;
}

function getReactCurrentRoot(element=document.querySelector('#root')){
    for(const key in element){
        if(key.startsWith('_reactRootContainer')){
            let container = element[key];
            let cur = container?._internalRoot?.current;
            if(cur !== undefined){
                return cur;
            }
        }
    }
    return null;
}

function searchReactParents(node, predicate, maxDepth = 15, depth = 0){
    try{
        if(predicate(node)){
            return node;
        }
    }catch(_){}
    if(!node || depth > maxDepth){
        return null;
    }
    const {'return': parent} = node;
    if(parent){
        return searchReactParents(parent, predicate, maxDepth, depth + 1);
    }
    return null;
}

function searchReactChildren(node, predicate, maxDepth = 15, depth = 0){
    try{
        if(predicate(node)){
            return node;
        }
    }catch(_){}
    if(!node || depth > maxDepth){
        return null;
    }
    const {child, sibling} = node;
    if(child || sibling){
        return searchReactChildren(child, predicate, maxDepth, depth + 1) || searchReactChildren(sibling, predicate, maxDepth, depth + 1);
    }
    return null;
}

function matchesParents(ele, selector){
    let parent = ele.parentElement;
    while(parent){
        if(parent.matches && parent.matches(selector)){
            return parent;
        }
        parent = parent.parentElement;
    }
}

export function matchesQuery(ele, selector, checkParents = false){
    if(ele.matches && ele.matches(selector)){
        return ele;
    }
    if(checkParents){
        let parentMatch = matchesParents(ele, selector);
        if(parentMatch){
            return parentMatch;
        }
    }
    return ele.querySelector(selector);
}

function observeSearch(callbackFound, callbackLost, selector, ele=document, one=false, timeout=CONSTS.PAGE_LOAD_TIMEOUT){
    let observer;
    let timeout_id;
    let set = new Set();
    function lost_check_recursively(ele){
        if(set.delete(ele)){
            if(callbackLost){
                callbackLost(ele);
            }
        }
        if(ele.children){
            for(let child of ele.children){
                lost_check_recursively(child);
            }
        }
    }
    function disable(){
        observer.disconnect();
        clearTimeout(timeout_id);
        if(set.size == 0){
            callbackFound();
        }
    }
    function found(f){
        if(set.has(f)){
            return;
        }
        set.add(f);
        if(one){
            disable();
            if(set.size > 1){
                return;
            }
        }
        callbackFound(f);
    }
    function foundList(fs){
        for(let f of fs){
            found(f);
        }
    }
    function lost(e){
        set.delete(e);
        if(callbackLost){
            callbackLost(e);
        }
    }
    function lostList(es){
        for(let e of es){
            lost(e);
        }
    }
    observer = new window.MutationObserver(mutations => mutations.forEach(mutation => {
        if(mutation.type == 'childList'){
            for(let node of mutation.addedNodes){
                if(node.matches && node.matches(selector)){
                    found(node);
                }
                if(node.querySelectorAll){
                    let fs = node.querySelectorAll(selector);
                    foundList(fs);
                }
            }
            for(let node of mutation.removedNodes){
                lost_check_recursively(node);
            }
        }
    }));
    observer.observe(ele, {childList: true, subtree: true});
    let fs = ele.querySelectorAll(selector);
    foundList(fs);
    if(timeout){
        timeout_id = setTimeout(disable, timeout);
    }
}

function observeGet(callback, ele, selector){
    let observer = new window.MutationObserver(mutations => mutations.forEach(mutation => {
        if(mutation.type == 'childList'){
            for(let node of mutation.addedNodes){
                if(node.matches && node.matches(selector)){
                    callback(node);
                }
            }
        }
    }));
    observer.observe(ele, {childList: true, subtree: false});
    let nodes = ele.querySelectorAll(selector);
    for(let node of nodes){
        callback(node);
    }
}

export function getCurrentChat(ele=document){
    let currentChat;
    try{
        const node = searchReactParents(
            getReactInstance(matchesQuery(ele, CHAT_CONTAINER)),
            n => n.stateNode && n.stateNode.props && n.stateNode.props.onSendMessage
        );
        currentChat = node.stateNode;
    }catch(_){}
    return currentChat;
}

export function sendChatMessage(message, ele=document){
    const currentChat = getCurrentChat(ele);
    if(!currentChat){
        return;
    }
    currentChat.props.onSendMessage(message);
}

export function getChatController(ele=document){
    let chatContentComponent;
    try{
        const node = searchReactParents(
            getReactInstance(matchesQuery(ele, CHAT_CONTAINER)),
            n => n.stateNode && n.stateNode.props && n.stateNode.props.messageHandlerAPI && n.stateNode.props.chatConnectionAPI,
            32
        );
        chatContentComponent = node.stateNode;
    }catch(_){}
    return chatContentComponent;
}

export function getChatControllerFromRoomSelector(ele=document){
    let chatContentComponent;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, ROOM_SELECTOR)),
            n => n.stateNode && n.stateNode.props && n.stateNode.props.messageHandlerAPI && n.stateNode.props.chatConnectionAPI,
            256
        );
        chatContentComponent = node.stateNode;
    }catch(_){}
    return chatContentComponent;
}

export function sendNotifyMessage(body, chatController=getChatController()){
    if(!chatController){
        return;
    }
    const id = Date.now();
    chatController.pushMessage({
        type: 32,
        id,
        msgid: id,
        message: body,
        channel: `#${chatController.props.channelLogin}`
    });
}

export function sendChatAdminMessage(body, ele=document){
    const chatController = getChatController(ele);
    sendNotifyMessage(body, chatController);
}

export function getCurrentMediaPlayer(ele=document){
    let player;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, MEDIA_PLAYER_ROOT, true)),
            n => n.stateNode && n.stateNode.props && n.stateNode.props.mediaPlayerInstance,
            64
        );
        player = node.stateNode;
    }catch(_){}
    return player;
}

export function getPubsub(){
    if(window && window.__Twitch__pubsubInstances && window.__Twitch__pubsubInstances.production){
        return window.__Twitch__pubsubInstances.production;
    }else{
        return null;
    }
}

export function getMessage(node){
    let message;
    try{
        const nod = searchReactParents(
            getReactInstance(node),
            n => n.stateNode && n.stateNode.props && n.stateNode.props.message
        );
        message = nod.stateNode;
    }catch(_){}
    return message;
}

export function getChatSettings(ele=document){
    let chatSettings;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, CHAT_CONTAINER)),
            n => (n?.stateNode?.props?.showTimestamps !== undefined),
            96
        );
        chatSettings = node.stateNode;
    }catch(_){}
    return chatSettings;
}

export function getChatListPresentation(ele=document){
    let chatList;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, ROOM_SELECTOR)),
            n => n && n.stateNode && n.stateNode.getMessages &&
            n.stateNode.buffer && n.stateNode.prependHistoricalMessages,
            256
        );
        chatList = node.stateNode;
    }catch(_){}
    return chatList;
}

export function getChatBufferController(ele=document){
    let chatBuffer;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, ROOM_SELECTOR)),
            n => n && n.stateNode && n.stateNode.props && n.stateNode.props.messageBufferAPI,
            256
        );
        chatBuffer = node.stateNode;
    }catch(_){}
    return chatBuffer;
}

export function getApolloClient(){
    let client;
    try{
        const node = searchReactChildren(
            getReactCurrentRoot(),
            n => n.pendingProps?.value?.client
        );
        client = node.pendingProps.value.client;
    }catch(_){}
    return client;
}

export function getGqlQueryMessageBufferChatHistory(ele=document){
    let query;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, ROOM_SELECTOR)),
            n => n?.pendingProps?.query?.MessageBufferChatHistory,
            256
        );
        query = node.pendingProps.query.MessageBufferChatHistory;
    }catch(_){}
    return query;
}

export function getGqlQueryMessageBufferChatHistoryRenderer(ele=document){
    let renderer;
    try{
        const node = searchReactChildren(
            getReactInstance(matchesQuery(ele, ROOM_SELECTOR)),
            n => n.stateNode && n.stateNode.setWrappedInstance &&
            n.stateNode.props && n.stateNode.props.channelLogin &&
            (n.stateNode.props.isLoggedIn !== undefined) &&
            n.stateNode.props.data,
            256
        );
        renderer = node.stateNode;
    }catch(_){}
    return renderer;
}

export function observeSearchRoomSelector(callback, callbackLost=null, ele=document){
    observeSearch(callback, callbackLost, ROOM_SELECTOR, ele, false, null);
}

export function observeGetChatRoomComponent(callback, roomSelector){
    observeGet(callback, roomSelector, CHAT_CONTAINER);
}

export function observeSearchChatLog(callback, ele=document){
    observeSearch(callback, null, TWITCH_LOG_SELECTOR, ele, true);
}

export function observeSearchPlayerRoot(callback, ele=document){
    observeSearch(callback, null, PLAYER_ROOT, ele, false, null);
}

export function observeSearchMediaPlayerRoot(callback, ele=document){
    observeSearch(callback, null, MEDIA_PLAYER_ROOT, ele, false, null);
}

export function observeSearchCommunityPointsSummary(callback, ele=document){
    observeSearch(callback, null, COMMUNITY_POINTS_SUMMARY, ele, false, null);
}

export function observeGetCommunityPointsSummaryClaimButton(callback, communityPointsSummary){
    observeSearch(callback, null, COMMUNITY_POINTS_SUMMARY_CLAIM_BUTTON, communityPointsSummary, false, null);
}

export function observeSearchRaidBanner(callback, ele=document){
    observeSearch(callback, null, RAID_BANNER, ele, false, null);
}

function waitGetBack(f, r, trys, delay){
    let d = f();
    if(d !== undefined){
        r(d);
    }else{
        if(trys <= 0){
            r();
        }
        setTimeout(() => {
            waitGetBack(f, r, trys - 1);
        }, delay);
    }
}

export function waitGet(f, trys=(CONSTS.PAGE_LOAD_TIMEOUT / 100), delay=100){
    return new Promise(r => {waitGetBack(f, r, trys, delay);});
}
