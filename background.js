/*
 * Ports
 */

var ports = [];

chrome.extension.onConnect.addListener(function(port) {
    var portWrapper = {
        port: port,
        callback: function() {}
    };

    port.onMessage.addListener(function(msg) {
        if(msg == 'error') { // Error message
            notify(chrome.i18n.getMessage('error_title'), chrome.i18n.getMessage('error_content'));
        } else { // URL
            portWrapper.callback(msg);
        }
    });

    port.onDisconnect.addListener(function() {
        ports.splice(ports.indexOf(portWrapper), 1);
    });

    ports.push(portWrapper);
});


/*
 * Functions
 */

function notify(title, content) {
    var notif = webkitNotifications.createNotification('icons/main48.png', title, content).show();

    setTimeout(function() {
        notif.cancel();
    }, 5000);
}

function getBackgroundUrl(tab, callback) {
    if(tab.status != 'complete') { // Status must be "complete" otherwise the content script could not be executed in time
        notify(chrome.i18n.getMessage('loadingDOM_title'), chrome.i18n.getMessage('loadingDOM_content'));
        return;
    }

    for(var i = 0, wrapper ; wrapper = ports[i++] ;) {
        if(wrapper.port.sender.tab.id == tab.id) {
            wrapper.callback = callback;
            wrapper.port.postMessage('getBackgroundUrl');
            return;
        }
    }
}

function openImg(url, tab, newTab) { // "tab" contains the opener tab if "newTab" is set to true

    if(url) { // There's a valid url
        if(!newTab) {
            chrome.tabs.update(tab.id, {
                url: url
            });
        } else {
            chrome.tabs.create({
                index: tab.index + 1, // Opens the new tab next the current one
                openerTabId: tab.id,
                url: url
            });
        }
    } else { // Not a url, we must alert the user
        notify(chrome.i18n.getMessage('noBackImg_title'), chrome.i18n.getMessage('noBackImg_content'));
    }
}

function executeScript(filename, urls) { // Executes a script on the tabs matching the url patterns
    chrome.tabs.query({ url: urls.pop() }, function(tabs) {
        tabs.forEach(function(tab) {
            chrome.tabs.executeScript(tab.id, { file: filename });
        });
    });

    urls.length && executeScript(filename, urls);
}


/*
 * Context menus
 */

chrome.contextMenus.create({

    title: chrome.i18n.getMessage('dispImg'),
    contexts: ['image'],

    onclick: function(infos, tab) {
        openImg(infos.srcUrl, tab);
    }

});

chrome.contextMenus.create({

    title: chrome.i18n.getMessage('dispBackImg'),
    contexts: ['all'],

    onclick: function(infos, tab) {
        getBackgroundUrl(tab, function(url) {
            openImg(url, tab);
        });
    }

});

chrome.contextMenus.create({

    title: chrome.i18n.getMessage('dispBackImg_newTab'),
    contexts: ['all'],

    onclick: function(infos, tab) {
        getBackgroundUrl(tab, function(url) {
            openImg(url, tab, true);
        });
    }

});


/*
 * Installation : executes the content script on the tabs already opened
 */

if(!localStorage['installDone']) { // If this variable isn't available, it's an installation
    localStorage['installDone'] = true;
    executeScript('contentscript.js', ['http://*/*', 'https://*/*']);
}