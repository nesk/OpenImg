/*
 * Functions
 */

function $(query) {
    return document.querySelector(query);
}


/*
 * Object : VImgPos
 * Used to position an image at the middle of his parent's vertical axis
 */

var VImgPos = (function() {

    function VImgPos(img) {
        this.timerId = null;
        this.img = img;
        this.parent = img.parentNode;
    }

    var fn = VImgPos.prototype;

    fn.calculatePos = function(offset) {
        offset = offset || 0;

        return (this.parent.offsetHeight + offset > this.img.height)
            ? (this.parent.offsetHeight + offset - this.img.height) / 2 +'px'
            : 0;
    };

    fn.adjustImg = function() {
        this.img.style.marginTop = this.calculatePos();
    };

    /*
     * This method seems to be a bad idea but I do not have choice. Using events
     * to know when to apply image adjustements is freaking me out because of
     * all the bugs you can encounter. Don't hesitate to contribute if you would
     * like to see events ;)
     */
    fn.startLoop = function(msInterval) {
        this.adjustImg();

        this.timerId = setTimeout((function(this_) {
            return function() {
                this_.startLoop(msInterval);
            };
        })(this), msInterval);
    };

    return VImgPos;

})();


/*
 * DOM generation
 */

document.body.innerHTML = [
    '<div class="drawer"><p><strong id="filename"></strong></p><p id="file-sizes">[...] x [...]px</p></div>',
    '<div class="content"><img class="img img-sized" src="'+ $('img').src +'"></div>'
].join('');


/*
 * Applying patterns
 */

$('.drawer').style.backgroundImage = 'url("'+ chrome.extension.getURL('resources/patterns/black-linen-v2.png') +'")';
$('.content').style.backgroundImage = 'url("'+ chrome.extension.getURL('resources/patterns/noise.png') +'")';


/*
 * Properties and content initialization
 */

var content = $('.content'),
    imgEL = $('img'),
    imgObj = new Image(),
    imgPos = new VImgPos(imgEL);

imgPos.startLoop(0); // Will apply image position when possible

$('#filename').innerHTML = decodeURIComponent(imgEL.src.substr(imgEL.src.lastIndexOf('/') + 1)) ;

/*
 * Events
 */

document.addEventListener('keypress', function(e) {
    e.preventDefault();
    e.keyCode == 32 && content.classList.toggle('drawer-revealed');
}, false);

imgEL.addEventListener('click', function() {
    this.classList.toggle('img-sized');
    imgPos.adjustImg();
}, false);

imgObj.onload = function() {
    imgPos.adjustImg();
    $('#file-sizes').innerHTML = this.width +' x '+ this.height +'px';
};
imgObj.src = imgEL.src;

window.onresize = imgPos.adjustImg;