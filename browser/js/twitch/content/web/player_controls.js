'use strict'; 

import * as CONSTS from './consts.mjs';
import { getCurrentPlayer,
         observeSearchPlayerRoot } from './twitch_objects.mjs';
import { getSettings } from './common.mjs';

const CLASS_PLAYER_CONTROLS = CONSTS.EXTENSION_CLASS_PREFIX + '-player-controls';
const CLASS_PLAYER_CONTROLS_SCRIPT = CLASS_PLAYER_CONTROLS + '-script';

const settings = getSettings(CLASS_PLAYER_CONTROLS_SCRIPT, CONSTS.DEFAULT_SETTINGS.PLAYER_CONTROLS_SETTINGS);

function guard(ele, name){
    let g = '__' + CONSTS.EXTENSION_VAR_PREFIX + '_' + 'player_controls' + '_' + name;
    if(ele[g]){
        return true;
    }else{
        ele[g] = true;
        return false;
    }
}

let speed_templates = [
    0.0625,
    0.125,
    0.25,
    0.5,
    0.75,
    1,
    1.25,
    1.5,
    2,
    2.5,
    3,
    3.5,
    4
];

function findClosestIndex(num, a){
    let min = Infinity;
    let index = -1;
    a.forEach(function(v, i, a){
        let diff = Math.abs(v - num);
        if(diff < min){
            min = diff;
            index = i;
        }
    });
    return index;
}

function changeSpeed(player, step_offset){
    let rate = player.getPlaybackRate();
    let i = findClosestIndex(rate, speed_templates);
    let next = speed_templates[i + step_offset];
    if(next){
        player.setPlaybackRate(next);
    }
}

function toggleAdvancedSettings(ele, type){
    let menu = ele.querySelector('.pl-menu');
    let si = ele.querySelector('.pl-settings-icon');
    if(!si){return;}
    if(menu != null){si.click();}
    si.click();
    (function(){
    let sia = ele.querySelector('.qa-advanced-button');
    if(!sia){return;}
    sia.click();
    let selector;
    switch(type){
        case 'ad_stats': selector = '.qa-show-ad-stats-button'; break;
        case 'video_stats': selector = '.qa-show-stats-button'; break;
        case 'latency_mode': selector = '.qa-latency-mode-toggle'; break;
    }
    if(!selector){return;}
    let siab = ele.querySelector(selector);
    if(!siab){return;}
    let siabt = siab.querySelector('.pl-toggle')
    if(!siabt){return;}
    let siabtl = siabt.querySelector('label');
    if(!siabtl){return;}
    siabtl.click();
    })();
    si.click();
}

function changeQuality(ele, up){
    let menu = ele.querySelector('.pl-menu');
    let si = ele.querySelector('.pl-settings-icon');
    if(!si){return;}
    if(menu != null){si.click();}
    si.click();
    (function(){
    let siq = ele.querySelector('.qa-quality-button');
    if(!siq){return;}
    siq.click();
    let siqms = ele.querySelector('.pl-menu__section');
    if(!siqms){return;}
    let siqmia = ele.querySelector('.pl-menu__item--active');
    if(!siqmia){return;}
    let siqmias;
    if(up){
        siqmias = siqmia.previousSibling;
    }else{
        siqmias = siqmia.nextSibling;
    }
    if(!siqmias){return;}
    let siqmiasb = siqmias.querySelector('button');
    if(!siqmiasb){return;}
    siqmiasb.click();
    })();
    menu = ele.querySelector('.pl-menu');
    if(menu != null){si.click();}
}

function changeQualityTemp(player, up){
    if(!player._setBackendQuality){return;}
    let setQuality = player._setBackendQuality.bind(player);
}

function handleKeyboardEvent(e){
    let player_root = getCurrentPlayer(e.target);
    if(!player_root){return;}
    let player = player_root.props.player;
    let actions = 0;
    if(e.code == settings.keys.fullscreen_toggle){
        player.setFullscreen(!player.getFullscreen());
        ++actions;
    }
    if(e.code == settings.keys.mute_toggle){
        player.setMuted(!player.getMuted());
        ++actions;
    }
    if(e.code == settings.keys.pause_toggle){
        if(player.isPaused()){
            player.play();
        }else{
            player.pause();
        }
        ++actions;
    }
    if(e.code == settings.keys.theatre_toggle){
        player.setTheatre(!player.getTheatre());
        ++actions;
    }
    if(e.code == settings.keys.ad_stats){
        toggleAdvancedSettings(player_root.props.root, 'ad_stats');
        ++actions;
    }
    if(e.code == settings.keys.video_stats){
        toggleAdvancedSettings(player_root.props.root, 'video_stats');
        ++actions;
    }
    if(e.code == settings.keys.latency_mode){
        toggleAdvancedSettings(player_root.props.root, 'latency_mode');
        ++actions;
    }
    if(e.code == settings.keys.left_side_toggle){
        let button_div = document.body.querySelector('.collapse-toggle');
        if(button_div){
            let button = button_div.querySelector('button');
            if(button){ button.click(); }
        }
        ++actions;
    }
    if(e.code == settings.keys.right_side_toggle){
        let button_div = document.body.querySelector('.right-column__toggle-visibility');
        if(button_div){
            let button = button_div.querySelector('button');
            if(button){ button.click(); }
        }
        ++actions;
    }
    if(e.code == settings.keys.speed_up){
        changeSpeed(player, 1);
        ++actions;
    }
    if(e.code == settings.keys.speed_down){
        changeSpeed(player, -1);
        ++actions;
    }
    if(e.code == settings.keys.quality_up){
        changeQuality(player_root.props.root, true);
        ++actions;
    }
    if(e.code == settings.keys.quality_down){
        changeQuality(player_root.props.root, false);
        ++actions;
    }
}

function isPopout(player_root){
    return player_root.props.options.player == 'popout' || player_root.props.options.player == 'clips-embed';
}

function processPlayerRoot(ele){
    let player_root = getCurrentPlayer(ele);
    if(!guard(player_root.props.root, 'keydown_listener')){
        player_root.props.root.addEventListener('keydown', handleKeyboardEvent);
    }
    if(isPopout(player_root)){
        player_root.props.root.focus();
    }
}

function setup(){
    document.addEventListener('keydown', handleKeyboardEvent);
}

setup();
