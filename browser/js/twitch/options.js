'use strict'; 

const browser = chrome;
const storage = chrome.storage;

const KEYBIND_NONE = '<none>';
const KEYBIND_PRESS = '<press>';
const KEYBIND_PRESS_WAITING_ATTR = 'pass_waiting';

async function getDefStor(){
    const CONSTS = await import('./content/web/consts.mjs');
    const def_stor = {
        sync: CONSTS.DEFAULT_STORAGE.SYNC,
        local: CONSTS.DEFAULT_STORAGE.LOCAL
    }
    return def_stor;
}

async function setup(){
    const def_stor = await getDefStor();
    let stor = {};
    stor['sync'] = (await new Promise(r => storage.sync.get(def_stor['sync'], r)));
    stor['local'] = (await new Promise(r => storage.local.get(def_stor['local'], r)));
    function v(stor, path, arg){
        let paths = path.split('.');
        let c = stor;
        for(let i = 0; i < (paths.length - 1); ++i){
            c = c[paths[i]];
        }
        if(arg !== undefined){
            c[paths[paths.length - 1]] = arg;
        }
        return c[paths[paths.length - 1]];
    }
    let settings = document.getElementsByClassName('setting');
    function value_ele(stor, ele, path, set){
        switch(ele.getAttribute('type')){
            case "checkbox":
                if(set){
                    v(stor, path, ele.checked);
                }else{
                    ele.checked = v(stor, path);
                }
            break;
            case "text":
                if(set){
                    v(stor, path, ele.value);
                }else{
                    ele.value = v(stor, path);
                }
            break;
            case "number":
                if(set){
                    v(stor, path, Number(ele.value));
                }else{
                    ele.value = v(stor, path);
                }
            break;
            case "keybind":
                if(set){
                    v(stor, path, ele.key);
                }else{
                    ele.key = v(stor, path);
                }
            break;
        }
    }
    function values(set){
        for(let setting of settings){
            let path = setting.getAttribute('path');
            if(path){
                value_ele(stor, setting, path, set);
            }
        }
    }
    async function storage_set(){
        (await new Promise(r => storage.sync.set(stor['sync'], r)));
        (await new Promise(r => storage.local.set(stor['local'], r)));
    }
    async function save(){
        values(true);
        await storage_set();
    }
    async function reset(){
        stor = await getDefStor();
        values();
    }
    async function small_reset(event){
        let button_ele = event.target;
        let path = button_ele.getAttribute('path');
        let input_ele = document.querySelector('*.setting[path="' + path + '"]');
        v(stor, path, v(def_stor, path));
        value_ele(stor, input_ele, path);
    }
    let save_button = document.getElementById('save-button');
    save_button.addEventListener('click', save);
    let reset_button = document.getElementById('reset-button');
    reset_button.addEventListener('click', reset);
    let small_reset_buttons = document.getElementsByClassName('small-reset-button');
    for(let small_reset_button of small_reset_buttons){
        small_reset_button.title = 'Reset';
        small_reset_button.addEventListener('click', small_reset);
    }
    function keybind_button_click(event){
        let ele = event.target;
        if(ele.hasAttribute(KEYBIND_PRESS_WAITING_ATTR)){
            ele.removeAttribute(KEYBIND_PRESS_WAITING_ATTR);
            ele.key = ele.key;
        }else{
            ele.setAttribute(KEYBIND_PRESS_WAITING_ATTR, true);
            ele.textContent = KEYBIND_PRESS;
        }
    }
    function keybind_button_focusout(event){
        let ele = event.target;
        if(ele.hasAttribute(KEYBIND_PRESS_WAITING_ATTR)){
            ele.removeAttribute(KEYBIND_PRESS_WAITING_ATTR);
            ele.key = ele.key;
        }
    }
    function keybind_button_keydown(event){
        let ele = event.target;
        if(ele.hasAttribute(KEYBIND_PRESS_WAITING_ATTR)){
            ele.removeAttribute(KEYBIND_PRESS_WAITING_ATTR);
            switch(event.code){
                case 'Delete':
                case 'Backspace':
                case 'Escape':
                    ele.key = null;
                break;
                default:
                    ele.key = event.code;
                break;
            }
            event.preventDefault();
        }
    }
    function setup_keybind_button(ele){
        Object.defineProperty(ele, 'key', {
            set: function(key){
                if(key){
                    this.value = key;
                }else{
                    this.removeAttribute('value');
                }
                if(!this.hasAttribute(KEYBIND_PRESS_WAITING_ATTR)){
                    this.textContent = key ? key : KEYBIND_NONE;
                }
            },
            get: function(){
                if(this.value){
                    return this.value;
                }else{
                    return null;
                }
            }
        });
        ele.addEventListener('click', keybind_button_click);
        ele.addEventListener('keydown', keybind_button_keydown);
        ele.addEventListener('focusout', keybind_button_focusout)
    }
    let keybind_buttons = document.querySelectorAll('button.setting[type="keybind"]')
    keybind_buttons.forEach(setup_keybind_button);
    let h1_title = document.getElementById('title');
    if(h1_title){
        let details = browser.runtime.getManifest();
        let title = details.name + ' ' + details.version;
        document.title = title;
        h1_title.textContent = title;
    }
    values();
}

setup();
