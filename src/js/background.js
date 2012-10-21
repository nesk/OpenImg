/*
 * Ports
 */

var ports = [];

chrome.extension.onConnect.addListener(function(port) {
    var portWrapper = {
        port: port,
        callback: function() {}
    };

    portWrapper.delete = function() {
        ports.splice(ports.indexOf(portWrapper), 1);
    };

    port.onMessage.addListener(function(msg) {
        switch(msg) {

            case 'img-tab': // An image tab as been detected
                prepareImgTab(port.sender.tab);
            break;

            case 'background-error': // Background error message
                notify(i18n('error_title'), i18n('error_content'));
            break;

            default: // URL
                portWrapper.callback(msg);

        }
    });

    port.onDisconnect.addListener(portWrapper.delete);

    ports.push(portWrapper);
});


/*
 * Functions
 */

function i18n(msgId) { // Internationalization
    return chrome.i18n.getMessage(msgId);
}

function createContextMenu(msgId, context, onclick) {
    chrome.contextMenus.create({
        title: i18n(msgId),
        documentUrlPatterns: ['http://*/*', 'https://*/*'],
        contexts: [context],
        onclick: onclick
    });
}

function notify(title, content) {
    var notif = webkitNotifications.createNotification('resources/icons/main48.png', title, content).show();

    setTimeout(function() {
        notif && notif.cancel();
    }, 5000);
}

function getBackgroundUrl(tab, callback) {
    if(tab.status != 'complete') { // Status must be "complete" otherwise the content script could not be executed in time
        notify(i18n('loadingDOM_title'), i18n('loadingDOM_content'));
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
        notify(i18n('noBackImg_title'), i18n('noBackImg_content'));
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

function prepareImgTab(tab) {
    chrome.tabs.executeScript(tab.id, {
        runAt: 'document_start', // Runs the code as soon as possible
        file: 'src/js/img-tab.js'
    });

    chrome.tabs.insertCSS(tab.id, {
        runAt: 'document_start',
        file: 'src/css/img-tab.css'
    });
}


/*
 * Context menus
 */

createContextMenu('dispImg', 'image', function(infos, tab) {
    openImg(infos.srcUrl, tab);
});

createContextMenu('dispBackImg', 'all', function(infos, tab) {
    getBackgroundUrl(tab, function(url) {
        openImg(url, tab);
    });
});

createContextMenu('dispBackImg_newTab', 'all', function(infos, tab) {
    getBackgroundUrl(tab, function(url) {
        openImg(url, tab, true);
    });
});


/*
 * Installation : executes the content script on the tabs already opened
 */

if(!localStorage['installDone']) { // If this variable isn't available, it's an installation
    localStorage['installDone'] = true;
    executeScript('src/js/contentscript.js', ['http://*/*', 'https://*/*']);
}