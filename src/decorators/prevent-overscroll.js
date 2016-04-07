
var win = window;
var doc = document;

module.exports = function(node, instance) {

    node.addEventListener('mouseenter', disableScroll);
    node.addEventListener('mouseleave', enableScroll);

    //node.addEventListener('wheel', function(e) {
        //e.stopPropagation();
    //});
    //

    var contentHeight;

    function preventDefault(e) {

        e = e || win.event;
        if( (node.scrollTop == 0 && e.deltaY < 0) ||
           (node.scrollTop == contentHeight && e.deltaY > 0) ) {

            if (e.preventDefault)
                e.preventDefault();
            e.returnValue = false;
            return false;
        }
    }

    function disableScroll() {
        // cache height for perf and avoiding reflow/repaint
        contentHeight = node.scrollHeight - node.offsetHeight;

        win.addEventListener('DOMMouseScroll', preventDefault, false);
        win.addEventListener('wheel', preventDefault); // modern standard
        win.addEventListener('mousewheel', preventDefault); // older browsers, IE
        doc.addEventListener('mousewheel', preventDefault);
        win.addEventListener('touchmove', preventDefault); // mobile
    }

    function enableScroll() {

        win.removeEventListener('DOMMouseScroll', preventDefault, false);

        win.removeEventListener('wheel', preventDefault); // modern standard
        win.removeEventListener('mousewheel', preventDefault); // older browsers, IE
        doc.removeEventListener('mousewheel', preventDefault);
        win.removeEventListener('touchmove', preventDefault); // mobile
    }

    return {
        teardown: function() {
            node.removeEventListener('mouseenter', disableScroll);
            node.removeEventListener('mouseleave', enableScroll);
        }
    }


}

var keys = {
    37: 1,
    38: 1,
    39: 1,
    40: 1
};
