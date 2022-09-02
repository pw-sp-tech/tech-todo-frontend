$(document).ready(function() {
    basicDragDrop();

});

function basicDragDrop() {
    dragula([
        document.getElementById('b1'),
        document.getElementById('b2'),
        document.getElementById('b3'),
        document.getElementById('b4'),
        document.getElementById('b5')
    ])

    var element = document.getElementById("boards"); // Count Boards

    function disableselect(e) { return false; }
    document.onselectstart = new Function()
    document.onmousedown = disableselect

}