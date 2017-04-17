$(document).ready(function(){
    $('[data-toggle="popover"]').popover();
});
$(function () {

    $("#draggable").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#draggable1").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#draggable2").draggable({
        helper: "clone",
        cursor: 'move'
    });
     $("#draggable3").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#container").droppable({
        drop: function (event, ui) {
            var $canvas = $(this);
            if (!ui.draggable.hasClass('canvas-element')) {
                var $canvasElement = ui.draggable.clone();
                $canvasElement.addClass('canvas-element');
                $canvasElement.draggable({
                    containment: '#container'
                });
                $canvas.append($canvasElement);
                $canvasElement.css({
                    left: (ui.position.left),
                    top: (ui.position.top),
                    position: 'absolute'
                });
            }
        }
    });

});