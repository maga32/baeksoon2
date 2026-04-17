$(function() {
    var clipboard = new ClipboardJS('.copy-button');
    clipboard.on('success', function(e) {
        e.clearSelection();
    });
});