'use strict';

import { EXTENSION_CLASS_PREFIX, EXTENSION_VAR_PREFIX, DEFAULT_SETTINGS } from './consts.mjs';
import { getMessage, getChatSettings, getChatController,
         observeSearchRoomSelector, observeGetChatRoomComponent, observeSearchChatLog,
         matchesQuery } from './twitch_objects.mjs';
import { getSettings } from './common.mjs';
import formatDate from './date_format.mjs';

const CLASS_CHAT_LINE_TIMESTAMP = EXTENSION_CLASS_PREFIX + '-chat-line-timestamp';
const CLASS_CHAT_LINE_TIMESTAMP_SPAN = CLASS_CHAT_LINE_TIMESTAMP + '-span';
const CLASS_CHAT_LINE_TIMESTAMP_SPAN_TEXT = CLASS_CHAT_LINE_TIMESTAMP_SPAN + '-text';
const CLASS_CHAT_LINE_TIMESTAMP_SPAN_INVISIBLE_SPACE = CLASS_CHAT_LINE_TIMESTAMP_SPAN + '-invisible-space';
const CLASS_CHAT_LINE_TIMESTAMP_STYLE = CLASS_CHAT_LINE_TIMESTAMP + '-style';
const CLASS_CHAT_LINE_TIMESTAMP_SCRIPT = CLASS_CHAT_LINE_TIMESTAMP + '-script';

const TWITCH_CLASS_CHAT_LINE_TIMESTAMP = 'chat-line__timestamp';
const TWITCH_CHAT_LINE_TIMESTAMP_SELECTOR = 'span.' + TWITCH_CLASS_CHAT_LINE_TIMESTAMP + ':not(' + '.' + CLASS_CHAT_LINE_TIMESTAMP_SPAN + ')';
const TWITCH_CHAT_BADGE_SELECTOR = '.chat-badge';

const settings = getSettings(CLASS_CHAT_LINE_TIMESTAMP_SCRIPT, DEFAULT_SETTINGS.CUSTOM_TIMESTAMPS_SETTINGS);

function getTimeString(date){
    return formatDate(String(settings.timestamp_format), date);
}

function getTooltipTimeString(date){
    return formatDate(String(settings.tooltip_timestamp_format), date);
}

function guard(ele, name){
    let g = '__' + EXTENSION_VAR_PREFIX + '_' + 'timestamps' + '_' + name;
    if(ele[g]){
        return true;
    }else{
        ele[g] = true;
        return false;
    }
}

function processLineNode(node){
    if(node.querySelector('.' + CLASS_CHAT_LINE_TIMESTAMP_SPAN)){
        return;
    }
    let mes = getMessage(node);
    let inline_div = node.querySelector('.tw-inline') || node;
    if(mes){
        if(!mes.props.message.timestamp){
            mes.props.message.timestamp = Date.now();
        }
        let date = new Date(mes.props.message.timestamp);
        let span = document.createElement('span');
        span.classList.add(TWITCH_CLASS_CHAT_LINE_TIMESTAMP);
        span.classList.add(CLASS_CHAT_LINE_TIMESTAMP_SPAN);
        span.setAttribute('iso', date.toISOString());
        span.setAttribute('unix', date.getTime());
        let span_text = document.createElement('span');
        span_text.classList.add(CLASS_CHAT_LINE_TIMESTAMP_SPAN_TEXT);
        span_text.textContent = getTimeString(date);
        span_text.title = getTooltipTimeString(date);
        span.appendChild(span_text);
        let span_space = document.createElement('span');
        span_space.classList.add(CLASS_CHAT_LINE_TIMESTAMP_SPAN_INVISIBLE_SPACE);
        span_space.textContent = ' ';
        span.appendChild(span_space);
        inline_div.insertBefore(span, inline_div.firstChild);
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

function addStyle(){
    let style = document.createElement('style');
    style.classList.add(CLASS_CHAT_LINE_TIMESTAMP_STYLE);
    document.head.appendChild(style);
    style.sheet.insertRule(TWITCH_CHAT_LINE_TIMESTAMP_SELECTOR + '{display: none}');
    style.sheet.insertRule('.' + CLASS_CHAT_LINE_TIMESTAMP_SPAN_INVISIBLE_SPACE + '{font-size: 0; line-height: 0;}');
    if(settings.prevent_chat_badge_selection){
        style.sheet.insertRule(TWITCH_CHAT_BADGE_SELECTOR + '{user-select: none}');
    }
    let staticRules = style.sheet.rules.length;
    function styleHide(hide){
        let haveHide = style.sheet.rules.length > staticRules;
        if(hide){
            if(!haveHide){
                style.sheet.insertRule('.' + CLASS_CHAT_LINE_TIMESTAMP_SPAN + '{display: none}');
            }
        }else{
            if(haveHide){
                style.sheet.removeRule(0);
            }
        }
    }
    return {
        hide_timestamps: styleHide
    }
}

let styleFunction = addStyle();

let hideTimestamps = styleFunction.hide_timestamps;

function addSettings(ele){
    let chat_settings = getChatSettings(ele);
    if(chat_settings && chat_settings.onTimestampToggle){
        if(guard(chat_settings, 'on_timestamp_toggle_patch')){
            return;
        }
        let originalOnTimestampToggle = chat_settings.onTimestampToggle;
        chat_settings.onTimestampToggle = function(...args){
            let hide = !!chat_settings.props.showTimestamps;
            hideTimestamps(hide);
            return originalOnTimestampToggle.bind(this)(...args);
        }
        hideTimestamps(!chat_settings.props.showTimestamps);
    }
}

function messageHandler(mes){
    if(!mes.timestamp){
        mes.timestamp = Date.now();
    }
}

function addMessageHandler(ele){
    let chatController = getChatController(ele);
    let api = chatController.props.messageHandlerAPI;
    if(guard(api, 'message_handler')){
        return;
    }
    api.addMessageHandler(messageHandler);
}

async function processRoomComponent(ele){
    addMessageHandler(ele);
    if(!Boolean(settings.force_enable)){
        addSettings(ele);
    }
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
