'use strict'; 

import * as CONSTS from './consts.mjs';
import { getCurrentMediaPlayer,
         matchesQuery,
         observeSearchPlayerRoot,
         observeSearchMediaPlayerRoot } from './twitch_objects.mjs';
import { getSettings } from './common.mjs';

const CLASS_PLAYER_CONTROLS = CONSTS.EXTENSION_CLASS_PREFIX + '-player-controls';
const CLASS_PLAYER_CONTROLS_SCRIPT = CLASS_PLAYER_CONTROLS + '-script';
const VAR_PREFIX = '__' + CONSTS.EXTENSION_VAR_PREFIX + '_' + 'player_controls' + '_';

const SELECTORS = {
    media_player: {
        settings_menu: '*[data-a-target="player-settings-menu"]',
        settings_icon: 'button[data-a-target="player-settings-button"]',
        settings_menu_advanced: 'button[data-a-target="player-settings-menu-item-advanced"]',
        settings_menu_advanced_ad_stats: '.tw-toggle[data-a-target="player-settings-submenu-advanced-ad-stats"] > input',
        settings_menu_advanced_video_stats: '.tw-toggle[data-a-target="player-settings-submenu-advanced-video-stats"] > input',
        // latency toggle doesn't have a 'data-a-target' attr, so we select the first one
        settings_menu_advanced_latency_mode: 'div[data-a-target="player-settings-menu"] .tw-toggle:not([data-a-target]) > input',
        settings_menu_quality_button: 'button[data-a-target="player-settings-menu-item-quality"]',
        settings_theatre: 'button[aria-label*="(alt+t)"]',
        settings_fullscreen: 'button[data-a-target="player-fullscreen-button"]'
    }
};

const settings = getSettings(CLASS_PLAYER_CONTROLS_SCRIPT, CONSTS.DEFAULT_SETTINGS.PLAYER_CONTROLS_SETTINGS);

function guard(ele, name){
    let g = VAR_PREFIX + name;
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
    player.setPlaybackRate(next || rate);
}

function seekMediaPlayer(player, interval){
    player.seekTo(player.getPosition() + interval);
}

function toggleAdvancedSettings(ele, type, selectors){
    let menu = ele.querySelector(selectors.settings_menu);
    let si = ele.querySelector(selectors.settings_icon);
    if(!si){return;}
    if(menu != null){si.click();}
    si.click();
    (function(){
    let sia = document.querySelector(selectors.settings_menu_advanced);
    if(!sia){return;}
    sia.click();
    let selector;
    switch(type){
        case 'ad_stats': selector = selectors.settings_menu_advanced_ad_stats; break;
        case 'video_stats': selector = selectors.settings_menu_advanced_video_stats; break;
        case 'latency_mode': selector = selectors.settings_menu_advanced_latency_mode; break;
    }
    if(!selector){return;}
    let siab = document.querySelector(selector);
    if(!siab){return;}
    siab.click();
    })();
    si.click();
}

function changeQualityMediaPlayer(player, step_offset){
    let qualities = player.getQualities();
    let current = -1;
    if(!player.isAutoQualityMode()){
        let quality = player.getQuality();
        current = qualities.findIndex(q=>q.name==quality.name);
    }
    let next = Math.max(-1, Math.min(current + step_offset, qualities.length - 1));
    if(next == -1){
        player.setAutoQualityMode(true);
    }else{
        player.setQuality(qualities[next]);
    }
}

function getMediaPlayerRoot(media_player){
    let video = media_player &&
                media_player.core &&
                media_player.core.mediaSinkManager &&
                media_player.core.mediaSinkManager.video;
    let node = video;
    while(node){
        let child = matchesQuery(video, '.video-player', true);
        if(child){
            return child;
        }
        node = node.parentElement;
    }
}

function handleKeyboardEvent(e){
    let media_player_root = getCurrentMediaPlayer(e.target);
    if(!(media_player_root)){return;}
    let media_player = media_player_root && media_player_root.props.mediaPlayerInstance;
    let actions = 0;
    if(media_player && settings.prevent_conflicts){
        patchPlayerSetters(media_player.__proto__);
    }
    if(e.code == settings.keys.fullscreen_toggle){
        let root = getMediaPlayerRoot(media_player);
        if(root){
            let fullscreen_button = root.querySelector(SELECTORS.media_player.settings_fullscreen);
            if(fullscreen_button){
                fullscreen_button.click();
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.mute_toggle){
        media_player.setMuted(!media_player.isMuted());
        ++actions;
    }
    if(e.code == settings.keys.pause_toggle){
        if(media_player.isPaused()){
            media_player.play();
        }else{
            media_player.pause();
        }
        ++actions;
    }
    let seek_interval = (e.shiftKey ? settings.seek_interval_with_shift : settings.seek_interval);
    if(e.code == settings.keys.seek_forwards){
        seekMediaPlayer(media_player, seek_interval);
    }
    if(e.code == settings.keys.seek_backwards){
        seekMediaPlayer(media_player, -seek_interval);
    }
    if(e.code == settings.keys.theatre_toggle){
        let root = getMediaPlayerRoot(media_player);
        if(root){
            let theatre_mode_button = root.querySelector(SELECTORS.media_player.settings_theatre);
            if(theatre_mode_button){
                theatre_mode_button.click();
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.ad_stats){
        let root = getMediaPlayerRoot(media_player);
        if(root){
            toggleAdvancedSettings(root, 'ad_stats', SELECTORS.media_player);
        }
        ++actions;
    }
    if(e.code == settings.keys.video_stats){
        let root = getMediaPlayerRoot(media_player);
        if(root){
            toggleAdvancedSettings(root, 'video_stats', SELECTORS.media_player);
        }
        ++actions;
    }
    if(e.code == settings.keys.latency_mode){
        let root = getMediaPlayerRoot(media_player);
        if(root){
            toggleAdvancedSettings(root, 'latency_mode', SELECTORS.media_player);
        }
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
        changeSpeed(media_player, 1);
        ++actions;
    }
    if(e.code == settings.keys.speed_down){
        changeSpeed(media_player, -1);
        ++actions;
    }
    if(e.code == settings.keys.quality_up){
        changeQualityMediaPlayer(media_player, -1);
        ++actions;
    }
    if(e.code == settings.keys.quality_down){
        changeQualityMediaPlayer(media_player, 1);
        ++actions;
    }
}

function isDateNear(date){
    let now = new Date();
    return ((now - date) < 50) ? true : false;
}

function patchPlayerFunction(player, func_name, guard_name=func_name){
    if(player[func_name] && !guard(player, func_name + '_patched')){
        const guard_field = VAR_PREFIX + 'last_date_' + guard_name;
        let originalFunc = player[func_name];
        player[func_name] = function(...args){
            if(isDateNear(this[guard_field])){
                return;
            }
            this[guard_field] = new Date();
            return originalFunc.bind(this)(...args);
        }
    }
}

function patchPlayerSetters(player){
    patchPlayerFunction(player, "play", "playpause");
    patchPlayerFunction(player, "pause", "playpause");
    patchPlayerFunction(player, "setMuted");
    patchPlayerFunction(player, "setPlaybackRate");
    patchPlayerFunction(player, "seekTo");
}

async function processMediaPlayerRoot(ele){
    await new Promise(r => setTimeout(r, CONSTS.INSIDES_LOAD_TIMEOUT));
    let media_player_root = getCurrentMediaPlayer(ele);
    let media_player = media_player_root && media_player_root.props.mediaPlayerInstance;
    if(media_player){
        if(settings.prevent_conflicts){
            patchPlayerSetters(media_player.__proto__);
        }
    }
}

function setup(){
    document.addEventListener('keydown', handleKeyboardEvent);
    observeSearchMediaPlayerRoot(processMediaPlayerRoot);
}

setup();
