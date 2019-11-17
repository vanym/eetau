'use strict';

const browser = chrome;
const storage = chrome.storage;

function parseUrl(url){
    let url_info = new URL(url);
    url_info.paths = url_info.pathname.substr(1).split('/');
    url_info.domains = url_info.hostname.split('.').reverse();
    return url_info;
}
