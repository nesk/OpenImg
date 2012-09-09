/*
 * This script is necessary to browse the HTML content and find the background URL
 */

(function() {

    /*
     * Properties
     */

    var port = chrome.extension.connect(),
        target; // Contains the latest clicked element, needed because Chrome contextMenus can't provide it


    /*
     * Functions
     */

    function getBackgroundUrl() {
        var el = target,
            style,
            url = 'none';

        do {
            style = getComputedStyle(el);
            style && (url = style.backgroundImage);
        } while((el = el.parentNode) && url == 'none');

        return url.slice(4, -1); // "backgroundImage" property also provides the "url()" characters, we need to remove them
    }


    /*
     * Events initialization
     */

    document.body.addEventListener('mousedown', function(e) {
        target = e.target;
    }, false);

    port.onMessage.addListener(function() {
        var url = getBackgroundUrl();
        url != 'none' && port.postMessage(url); // Transmits the background URL to the background script, if there's one
    });

})();