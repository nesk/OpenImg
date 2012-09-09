/*
 * Ports
 */

var ports = [];

chrome.extension.onConnect.addListener(function(port) {
    var portWrapper = {
        port: port,
        callback: function() {}
    };

    port.onMessage.addListener(function(url) {
        (url != 'none') && portWrapper.callback(url);
    });

    port.onDisconnect.addListener(function() {
        ports.splice(ports.indexOf(portWrapper), 1);
    });

    ports.push(portWrapper);
});


/*
 * Functions
 */

function getBackgroundUrl(tab, callback) {
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
    } else { // No url, we must alert the user
        var notif = webkitNotifications.createNotification(
          'icons/main48.png',
          chrome.i18n.getMessage('noBackImg_title'),
          chrome.i18n.getMessage('noBackImg_content')
        );

        notif.show();
    }
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