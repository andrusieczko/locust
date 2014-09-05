var numberOfStatsRows = 100;

var $tableFooterTd = $('#stats tfoot td');
var $loadMoreButton = $('<button>').text('Load more rows');
$tableFooterTd.append($loadMoreButton);
$loadMoreButton.bind('click', function() {
    numberOfStatsRows += 100;
});

$(window).ready(function() {
    if($("#locust_count").length > 0) {
        $("#locust_count").focus().select();
    }
});

$("#box_stop a").click(function(event) {
    event.preventDefault();
    $.get($(this).attr("href"));
    $("body").attr("class", "stopped");
    $(".box_stop").hide();
    $("a.new_test").show();
    $("a.edit_test").hide();
    $(".user_count").hide();
});

$("#box_reset a").click(function(event) {
    event.preventDefault();
    $.get($(this).attr("href"));
});

$("#new_test").click(function(event) {
    event.preventDefault();
    $("#start").show();
    $("#locust_count").focus().select();
});

$(".edit_test").click(function(event) {
    event.preventDefault();
    $("#edit").show();
    $("#new_locust_count").focus().select();
});

$(".close_link").click(function(event) {
    event.preventDefault();
    $(this).parent().parent().hide();
});

var alternate = false;

$("ul.tabs").tabs("div.panes > div");

var stats_tpl = $('#stats-template');
var errors_tpl = $('#errors-template');
var exceptions_tpl = $('#exceptions-template');

var isTimeElapsed = function(startTime, runTimeValue) {
    var endTime = new Date();
    var duration = endTime - startTime;
    var runTimeValueInMiliSecs = runTimeValue * 60 * 1000;
    return duration > runTimeValueInMiliSecs;
};

var addLeadingZero = function(value) {
    return (value < 10 ? "0" : "") + (value < 0 ? 0 : value);
};

var formatDuration = function(miliseconds) {
    var hours = Math.floor(miliseconds / (60 * 60 * 1000));
    var minutes = Math.floor(miliseconds / (60 * 1000)) % 60;
    var seconds = Math.floor(miliseconds / 1000) % 60;
    return [hours, minutes, seconds].map(addLeadingZero).join(':');
};

var checkTime = function(startTime, runTimeValue, finishTime) {
    var now = new Date();
    var runTime = formatDuration(now - startTime);
    var remainingTime = formatDuration(finishTime - now);
    $('.run-time').text(runTime);
    $('.remaining-time').text(remainingTime);
    
    if (isTimeElapsed(startTime, runTimeValue)) {
        $("#box_stop a").click();
    } else {
        // TODO: when you start new test, you're doubling the listeners 
        setTimeout(checkTime, 1000, startTime, runTimeValue, finishTime);
    }
};

$('#swarm_form').submit(function(event) {
    event.preventDefault();

    var startTime = new Date();
    var runTimeValue = $('#run_time').val();
    var finishTime = new Date(startTime.getTime() + runTimeValue*60*1000);
    checkTime(startTime, runTimeValue, finishTime);

    $('.start-time').text(startTime.toLocaleTimeString());
    $('.finish-time').text(finishTime.toLocaleTimeString());

    $.post($(this).attr("action"), $(this).serialize(),
        function(response) {
            if (response.success) {
                $("body").attr("class", "hatching");
                $("#start").fadeOut();
                $("#status").fadeIn();
                $(".box_running").fadeIn();
                $("a.new_test").fadeOut();
                $("a.edit_test").fadeIn();
                $(".user_count").fadeIn();
            }
        }
    );
});

$('#edit_form').submit(function(event) {
    event.preventDefault();
    $.post($(this).attr("action"), $(this).serialize(),
        function(response) {
            if (response.success) {
                $("body").attr("class", "hatching");
                $("#edit").fadeOut();
            }
        }
    );
});

var sortBy = function(field, reverse, primer){
    reverse = (reverse) ? -1 : 1;
    return function(a,b){
        a = a[field];
        b = b[field];
       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }
       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       return 0;
    }
}

// Sorting by column
var sortAttribute = "name";
var desc = false;
var report;
$(".stats_label").click(function(event) {
    event.preventDefault();
    sortAttribute = $(this).attr("data-sortkey");
    desc = !desc;

    $('#stats tbody').empty();
    $('#errors tbody').empty();
    alternate = false;
    totalRow = report.stats.pop()
    sortedStats = (report.stats).sort(sortBy(sortAttribute, desc))

    sortedStats.push(totalRow)
    $('#stats tbody').jqoteapp(stats_tpl, sortedStats);
    alternate = false;
    $('#errors tbody').jqoteapp(errors_tpl, (report.errors).sort(sortBy(sortAttribute, desc)));
});

function updateStats() {
    $.get('/stats/requests', function (data) {
        report = JSON.parse(data);
        $("#total_rps").html(Math.round(report.total_rps*100)/100);
        //$("#fail_ratio").html(Math.round(report.fail_ratio*10000)/100);
        $("#fail_ratio").html(Math.round(report.fail_ratio*100));
        $("#status_text").html(report.state);
        $("#userCount").html(report.user_count);

        if (report.slave_count)
            $("#slaveCount").html(report.slave_count)

        $('#stats tbody').empty();
        $('#errors tbody').empty();

        alternate = false;

        totalRow = report.stats.pop()
        sortedStats = (report.stats).sort(sortBy(sortAttribute, desc))
        
        sortedStats = sortedStats.slice(0, numberOfStatsRows);
        
        sortedStats.push(totalRow)
        $('#stats tbody').jqoteapp(stats_tpl, sortedStats);
        alternate = false;
        $('#errors tbody').jqoteapp(errors_tpl, (report.errors).sort(sortBy(sortAttribute, desc)));
        setTimeout(updateStats, 2000);
    });
}
updateStats();

function updateExceptions() {
    $.get('/exceptions', function (data) {
        $('#exceptions tbody').empty();
        $('#exceptions tbody').jqoteapp(exceptions_tpl, data.exceptions);
        setTimeout(updateExceptions, 5000);
    });
}
updateExceptions();