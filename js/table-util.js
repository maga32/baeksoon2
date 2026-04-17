$(document).ready(function() {
    if ($(".sortable-table").length > 0) {
        var table = $(".sortable-table").stupidtable();
        table.bind('aftertablesort', function (event, data) {
            var th = $(this).find("th");
            th.find(".arrow").remove();
            var arrow = data.direction === "asc" ? "â†‘" : "â†“";
            th.eq(data.column).append('<span class="arrow">' + arrow +'</span>');
        });
    }
});