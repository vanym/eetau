'use strict';

import { getCurrentChat,
         sendChatMessage,
         getChatController,
         getChatControllerFromRoomSelector,
         sendNotifyMessage,
         sendChatAdminMessage,
         getCurrentPlayer,
         getCurrentMediaPlayer,
         getPubsub,
         getMessage,
         getChatSettings,
         getChatListPresentation,
         getChatBufferController,
         observeSearchRoomSelector,
         observeGetChatRoomComponent,
         observeSearchChatLog,
         observeSearchPlayerRoot,
         observeSearchMediaPlayerRoot,
         observeSearchCommunityPointsSummary,
         observeGetCommunityPointsSummaryClaimButton,
         observeSearchRaidBanner,
         waitGet } from './twitch_objects.mjs';

window.getCurrentChat                    = getCurrentChat;
window.sendChatMessage                   = sendChatMessage;
window.getChatController                 = getChatController;
window.getChatControllerFromRoomSelector = getChatControllerFromRoomSelector;
window.sendNotifyMessage                 = sendNotifyMessage;
window.sendChatAdminMessage              = sendChatAdminMessage;
window.getCurrentPlayer                  = getCurrentPlayer;
window.getCurrentMediaPlayer             = getCurrentMediaPlayer;
window.getPubsub                         = getPubsub;
window.getMessage                        = getMessage;
window.getChatSettings                   = getChatSettings;
window.getChatListPresentation           = getChatListPresentation;
window.getChatBufferController           = getChatBufferController;
window.observeSearchRoomSelector         = observeSearchRoomSelector;
window.observeGetChatRoomComponent       = observeGetChatRoomComponent;
window.observeSearchChatLog              = observeSearchChatLog;
window.observeSearchPlayerRoot           = observeSearchPlayerRoot;
window.observeSearchMediaPlayerRoot      = observeSearchMediaPlayerRoot;
window.observeSearchCommunityPointsSummary = observeSearchCommunityPointsSummary;
window.observeGetCommunityPointsSummaryClaimButton = observeGetCommunityPointsSummaryClaimButton;
window.observeSearchRaidBanner           = observeSearchRaidBanner;
window.waitGet                           = waitGet;

function getReactInstance(element){
    for(const key in element){
        if(key.startsWith('__reactInternalInstance$')){
            return element[key];
        }
    }
    return null;
}

function searchReactParents(node, predicate, maxDepth = 15, depth = 0){
    try{
        if(predicate(node)){
            console.log(depth);
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
            console.log(depth);
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

function deepPredicate(predicate, maxDepth = 4){
    function check(e, path = [], set = new Set()){
        if(path.length >= maxDepth){
            return;
        }
        if(set.has(e)){
            return;
        }
        try{
            if(predicate(e)){
                console.log(path);
                return e;
            }
        }catch(e){}
        set.add(e);
        try{
            for(let k in e){
                path.push(k);
                let r = check(e[k], path, set);
                path.pop();
                if(r){
                    return r;
                }
            }
        }catch(e){}
    }
    return check;
}

function ultimateSearchReact(ele, predicate){
    let react = getReactInstance(ele);
    function found(n){
        console.log(ele);
        let outerHTML = ele.outerHTML;
        let outerStart = outerHTML.search(/</);
        let outerEnd   = outerHTML.search(/>/);
        let str = outerHTML.substr(outerStart, outerEnd + 1);
        console.log(str);
        console.log(n);
        console.log('----------------');
        a.push(n);
    }
    let p = searchReactParents(react, predicate, 0x10000);
    let a = [];
    if(p){
        console.log('parents');
        found(p);
    }
    let c = searchReactChildren(react, predicate, 0x10000);
    if(c){
        console.log('children');
        found(c);
    }
    for(let child of ele.children){
        let n = ultimateSearchReact(child, predicate);
        a = a.concat(n);
    }
    return a;
}

window.getReactInstance    = getReactInstance;
window.searchReactParents  = searchReactParents;
window.searchReactChildren = searchReactChildren;
window.deepPredicate       = deepPredicate;
window.ultimateSearchReact = ultimateSearchReact;
