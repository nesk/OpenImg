/*
 * This script tries to identify an HTML signature used by all the "images tabs"
 * (this is how I call a page which contains just an image). If the signature is
 * detected it will warn the background extension to inject the script used to
 * beautify these pages.
 */

/*
 * The setTimeout() function is here for a good reason. Inside image tabs,
 * Chrome fires the "document_end" event after the image has been fully loaded
 * and not after the DOM has been generated. This setTimeout(), coupled to the
 * "document_start" event, is here to make sure to execute this script right
 * after the DOM generation.
 */

function checkImgPage() {

    try { // To avoid errors when the DOM isn't fully loaded
        var isImgPage = (function() {
            var childs = document.body.childNodes;

            return (
                !document.querySelector('head') &&
                childs.length == 1 &&
                childs[0].tagName == 'IMG' &&
                childs[0].style.webkitUserSelect == 'none'
            );
        })();

        isImgPage && chrome.extension.connect().postMessage('img-tab');
    } catch(e){
        setTimeout(checkImgPage, 0);
    }

}

checkImgPage();