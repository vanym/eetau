'use strict';

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
