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

        if(!el) {
            port.postMessage('error'); // Unexpected error, the user must be alerted
        }

        do {
            style = getComputedStyle(el);
            style && (url = style.backgroundImage);
        } while((el = el.parentNode) && url == 'none');

        if(~url.indexOf('gradient(') || url == 'none') { // Avoids CSS3 gradients and none values
            url = null; // Sets url to none, it will alert the user that there's no background image
        } else {
            url = url.slice(4, -1); // "backgroundImage" property also provides the "url()" characters, we need to remove them
        }

        return url;
    }


    /*
     * Events initialization
     */

    document.body.addEventListener('mousedown', function(e) {
        target = e.target;
    }, false);

    port.onMessage.addListener(function() {
        port.postMessage(getBackgroundUrl()); // Transmits the background URL to the background script, even if there's no one
    });

})();