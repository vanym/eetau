'use strict'; 

import * as CONSTS from './consts.mjs';
import { getCurrentPlayer,
         getCurrentMediaPlayer,
         matchesQuery,
         observeSearchPlayerRoot,
         observeSearchMediaPlayerRoot } from './twitch_objects.mjs';
import { getSettings } from './common.mjs';

const CLASS_PLAYER_CONTROLS = CONSTS.EXTENSION_CLASS_PREFIX + '-player-controls';
const CLASS_PLAYER_CONTROLS_SCRIPT = CLASS_PLAYER_CONTROLS + '-script';
const VAR_PREFIX = '__' + CONSTS.EXTENSION_VAR_PREFIX + '_' + 'player_controls' + '_';

const SELECTORS = {
    player: {
        settings_menu: '.pl-menu',
        settings_icon: '.pl-settings-icon',
        settings_menu_advanced: '.qa-advanced-button',
        settings_menu_advanced_ad_stats: '.qa-show-ad-stats-button > .pl-toggle > label',
        settings_menu_advanced_video_stats: '.qa-show-stats-button > .pl-toggle > label',
        settings_menu_advanced_latency_mode: '.qa-latency-mode-toggle  > .pl-toggle > label',
        settings_menu_quality_button: '.qa-quality-button'
    },
    media_player: {
        settings_menu: '*[data-a-target="player-settings-menu"]',
        settings_icon: 'button[data-a-target="player-settings-button"]',
        settings_menu_advanced: 'button[data-a-target="player-settings-menu-item-advanced"]',
        settings_menu_advanced_ad_stats: '.tw-toggle[data-a-target="player-settings-submenu-advanced-ad-stats"] > label',
        settings_menu_advanced_video_stats: '.tw-toggle[data-a-target="player-settings-submenu-advanced-video-stats"] > label',
        settings_menu_advanced_latency_mode: '.tw-toggle[data-a-target="low-latency-toggle"] > label',
        settings_menu_quality_button: 'button[data-a-target="player-settings-menu-item-quality"]'
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

function seekPlayer(player, interval){
    player.setCurrentTime(player.getCurrentTime() + interval)
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
    let sia = ele.querySelector(selectors.settings_menu_advanced);
    if(!sia){return;}
    sia.click();
    let selector;
    switch(type){
        case 'ad_stats': selector = selectors.settings_menu_advanced_ad_stats; break;
        case 'video_stats': selector = selectors.settings_menu_advanced_video_stats; break;
        case 'latency_mode': selector = selectors.settings_menu_advanced_latency_mode; break;
    }
    if(!selector){return;}
    let siab = ele.querySelector(selector);
    if(!siab){return;}
    siab.click();
    })();
    si.click();
}

function changeQualityPlayer(ele, up){
    let menu = ele.querySelector(SELECTORS.player.settings_menu);
    let si = ele.querySelector(SELECTORS.player.settings_icon);
    if(!si){return;}
    if(menu != null){si.click();}
    si.click();
    (function(){
    let siq = ele.querySelector(SELECTORS.player.settings_menu_quality_button);
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
    menu = ele.querySelector(SELECTORS.player.settings_menu);
    if(menu != null){si.click();}
}

function changeQualityMediaPlayer(ele, up){
    let menu = ele.querySelector(SELECTORS.media_player.settings_menu);
    let si = ele.querySelector(SELECTORS.media_player.settings_icon);
    if(!si){return;}
    if(menu != null){si.click();}
    si.click();
    (function(){
    let siq = ele.querySelector(SELECTORS.media_player.settings_menu_quality_button);
    if(!siq){return;}
    siq.click();
    let quas = ele.querySelectorAll('*[data-a-target="player-settings-submenu-quality-option"] > input');
    let aquas = Array.from(quas);
    let i = aquas.findIndex(n => n.checked);
    if(up){
        --i;
    }else{
        ++i;
    }
    let nqua = aquas[i];
    if(!nqua){return;}
    nqua.click();
    })();
    menu = ele.querySelector(SELECTORS.media_player.settings_menu);
    if(menu != null){si.click();}
}

function changeQualityTemp(player, up){
    if(!player._setBackendQuality){return;}
    let setQuality = player._setBackendQuality.bind(player);
}

function getMediaPlayerRoot(media_player){
    return matchesQuery(media_player.mediaSinkManager.video, '.persistent-player', true);
}

function handleKeyboardEvent(e){
    let player_root = getCurrentPlayer(e.target);
    let media_player_root = getCurrentMediaPlayer(e.target);
    if(!(player_root || media_player_root)){return;}
    let player = player_root && player_root.props.player;
    let media_player = media_player_root && media_player_root.props.mediaPlayerInstance;
    let actions = 0;
    if(e.code == settings.keys.fullscreen_toggle){
        if(player){
            player.setFullscreen(!player.getFullscreen());
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                let fullscreen_button = root.querySelector('button[data-a-target="player-fullscreen-button"]');
                if(fullscreen_button){
                    fullscreen_button.click();
                }
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.mute_toggle){
        let isMuted = (player && player.getMuted) || (media_player && media_player.isMuted);
        let any_player = (player || media_player);
        any_player.setMuted(!isMuted.bind(any_player)());
        ++actions;
    }
    if(e.code == settings.keys.pause_toggle){
        let pl = (player || media_player);
        if(pl.isPaused()){
            pl.play();
        }else{
            pl.pause();
        }
        ++actions;
    }
    let seek_interval = (e.shiftKey ? settings.seek_interval_with_shift : settings.seek_interval);
    if(e.code == settings.keys.seek_forwards){
        if(player){
            seekPlayer(player, seek_interval);
        }
        if(media_player){
            seekMediaPlayer(media_player, seek_interval);
        }
    }
    if(e.code == settings.keys.seek_backwards){
        if(player){
            seekPlayer(player, -seek_interval);
        }
        if(media_player){
            seekMediaPlayer(media_player, -seek_interval);
        }
    }
    if(e.code == settings.keys.theatre_toggle){
        if(player){
            player.setTheatre(!player.getTheatre());
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                let theatre_mode_button = root.querySelector('button[data-a-target="player-theatre-mode-button"]');
                if(theatre_mode_button){
                    theatre_mode_button.click();
                }
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.ad_stats){
        if(player_root){
            toggleAdvancedSettings(player_root.props.root, 'ad_stats', SELECTORS.player);
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                toggleAdvancedSettings(root, 'ad_stats', SELECTORS.media_player);
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.video_stats){
        if(player_root){
            toggleAdvancedSettings(player_root.props.root, 'video_stats', SELECTORS.player);
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                toggleAdvancedSettings(root, 'video_stats', SELECTORS.media_player);
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.latency_mode){
        if(player_root){
            toggleAdvancedSettings(player_root.props.root, 'latency_mode', SELECTORS.player);
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                toggleAdvancedSettings(root, 'latency_mode', SELECTORS.media_player);
            }
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
        changeSpeed(player || media_player, 1);
        ++actions;
    }
    if(e.code == settings.keys.speed_down){
        changeSpeed(player || media_player, -1);
        ++actions;
    }
    if(e.code == settings.keys.quality_up){
        if(player_root){
            changeQualityPlayer(player_root.props.root, true);
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                changeQualityMediaPlayer(root, true);
            }
        }
        ++actions;
    }
    if(e.code == settings.keys.quality_down){
        if(player_root){
            changeQualityPlayer(player_root.props.root, false);
        }
        if(media_player){
            let root = getMediaPlayerRoot(media_player);
            if(root){
                changeQualityMediaPlayer(root, false);
            }
        }
        ++actions;
    }
}

function isPopout(player_root){
    return player_root.props.options.player == 'popout' || player_root.props.options.player == 'clips-embed';
}

function isDateNear(date){
    let now = new Date();
    return ((now - date) < 50) ? true : false;
}

function patchPlayerFunction(player, func_name){
    if(player[func_name] && !guard(player, func_name + '_patched')){
        const guard_field = VAR_PREFIX + 'last_date_' + func_name;
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
    patchPlayerFunction(player, "setMuted");
    patchPlayerFunction(player, "setPlaybackRate");
    patchPlayerFunction(player, "seekTo");
    patchPlayerFunction(player, "setCurrentTime");
}

async function processPlayerRoot(ele){
    await new Promise(r => setTimeout(r, CONSTS.INSIDES_LOAD_TIMEOUT));
    let player_root = getCurrentPlayer(ele);
    let player = player_root && player_root.props.player;
    if(player){
        if(settings.prevent_conflicts){
            patchPlayerSetters(player);
        }
    }
}

async function processMediaPlayerRoot(ele){
    await new Promise(r => setTimeout(r, CONSTS.INSIDES_LOAD_TIMEOUT));
    let media_player_root = getCurrentMediaPlayer(ele);
    let media_player = media_player_root && media_player_root.props.mediaPlayerInstance;
    if(media_player){
        if(settings.prevent_conflicts){
            patchPlayerSetters(media_player);
        }
    }
}

function setup(){
    document.addEventListener('keydown', handleKeyboardEvent);
    observeSearchPlayerRoot(processPlayerRoot);
    observeSearchMediaPlayerRoot(processMediaPlayerRoot);
}

setup();
