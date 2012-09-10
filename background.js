/*
 * Ports
 */

ports = []

chrome.extension.on-connect.add-listener (port) ->
    port-wrapper = {port, callback: ->}

    port.on-message.add-listener (url) ->
        port-wrapper.callback url unless url is 'none'

    port.on-disconnect.add-listener ->
        ports.splice (ports.index-of port-wrapper), 1

    ports.push port-wrapper

chrome.context-menus.create do
    title: get-message 'dispImg'
    contexts: <[image]>
    onclick: ({src-url}, tab) -> open-img src-url, tab

chrome.context-menus.create do
    title: get-message 'dispBackImg'
    contexts: <[all]>
    onclick: (, tab) ->
        get-background-url tab, (url) ->
            open-img url, tab

chrome.context-menus.create
    title: get-message 'dispBackImg_newTab'
    contexts: <[all]>
    onclick: (, tab) ->
        get-background-url tab, (url) ->
            open-img url, tab, true

!function getBackgroundUrl(tab, callback)
    for wrapper in ports when wrapper.port.sender.tab.id is tab.id

        wrapper.callback = callback
        wrapper.port.post-message 'getBackgroundUrl'

        return

!function openImg(url, {index, id}:tab, new-tab)
    if url
        if new-tab
            chrome.tabs.create {index: index + 1, opener-tab-id: id, url}
        else
            chrome.tabs.update tab.id, {url}
    else
        notif = webkit-notifications.create-notification do
            'icons/main48.png'
            get-message 'noBackImg_title'
            get-message 'noBackImg_content'

function get-message then chrome.i18n.get-message it