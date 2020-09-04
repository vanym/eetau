'use strict';

import { EXTENSION_CLASS_PREFIX, EXTENSION_VAR_PREFIX } from './consts.mjs';
import { observeSearchRoomSelector, observeGetChatRoomComponent, observeSearchChatLog,
         getMessage, matchesQuery } from './twitch_objects.mjs';

const CLASS_REPLY_BUTTON = EXTENSION_CLASS_PREFIX + '-reply-button';

function guard(ele, name){
    let g = '__' + EXTENSION_VAR_PREFIX + '_' + 'always_reply' + '_' + name;
    if(ele[g]){
        return true;
    }else{
        ele[g] = true;
        return false;
    }
}

function relpyClick(e){
    let mes = function(arr){
        for(let v of arr){
            let mes = getMessage(v);
            if(mes){
                return mes;
            }
        }
    }(e.path);
    if(mes){
        mes.setMessageTray(mes.props.message, mes.renderMessageBody());
    }
}

function isSelfSended(mes){
    return (mes.props.currentUserID == mes.props.message.user.userID)
        && (mes.props.message.id == String(mes.props.message.timestamp));
}

function processLineNode(node){
    if(node.querySelector('.' + CLASS_REPLY_BUTTON)){
        return;
    }
    let mes = getMessage(node);
    if(mes.tooltipRef != undefined && mes.props.reply != undefined && !isSelfSended(mes)){
        let buttons_div = mes.tooltipRef;
        let button2 = buttons_div.querySelector('button');
        if(button2){
            let button1 = document.createElement('button');
            button1.classList = button2.classList;
            button1.classList.add(CLASS_REPLY_BUTTON);
            button1.textContent = '⮌';
            button1.addEventListener('click', relpyClick);
            buttons_div.insertBefore(button1, button2);
        }
    }
}

function processLogNodeChild(node){
    let ele = matchesQuery(node, 'div[class*="chat-line"]');
    if(ele){
        processLineNode(ele);
    }
}

function processLogNode(log){
    if(guard(log, 'log_observed')){
        return;
    }
    let observer = new window.MutationObserver(mutations => mutations.forEach(mutation => {
        for(let node of mutation.addedNodes){
            processLogNodeChild(node);
        }
    }));
    observer.observe(log, {childList: true, subtree: false});
    for(let node of log.childNodes){
        processLogNodeChild(node);
    }
}

async function processRoomComponent(ele){
    let log = (await new Promise(r => observeSearchChatLog(r, ele)));
    processLogNode(log);
}

function processRoomSelector(ele){
    observeGetChatRoomComponent(processRoomComponent, ele);
}

function setup(){
    observeSearchRoomSelector(processRoomSelector);
}

setup();
