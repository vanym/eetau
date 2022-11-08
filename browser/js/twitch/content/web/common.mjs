'use strict';

export function parseUrl(url){
    let url_info = new URL(url);
    url_info.paths = url_info.pathname.substr(1).split('/');
    url_info.domains = url_info.hostname.split('.').reverse();
    return url_info;
}

export function getSettings(id, ...def_settings){
    let settings;
    try{
        let script = document.getElementById(id);
        if(!script){
            return;
        }
        let settings_json = script.getAttribute('settings');
        if(!settings_json){
            return;
        }
        settings = JSON.parse(settings_json);
    }catch(_){}
    return Object.assign({}, ...def_settings, settings);
}
