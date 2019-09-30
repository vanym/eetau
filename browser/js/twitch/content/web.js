'use strict';

const WEB_DIR = '/js/twitch/content/web';

function injectModuleScript(url, node=document.head){
    let script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.setAttribute('src', url);
    node.appendChild(script);
}
