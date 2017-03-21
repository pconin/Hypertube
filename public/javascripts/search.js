var $divs = $("div.torrents");
var wait = false;
//<<<<scroll infini>>>>>>
var socket = io.connect();
var pageNumber = 1;
if (!$('#search').val() || $('#search').val() === ''){
    var deviceAgent = navigator.userAgent.toLowerCase();
    var agentID = deviceAgent.match(/(iphone|ipod|ipad)/);
    
    // on déclence une fonction lorsque l'utilisateur utilise sa molette 
    $(window).scroll(function() {
        // cette condition vaut true lorsque le visiteur atteint le bas de page
        // si c'est un iDevice, l'évènement est déclenché 150px avant le bas de page
        if(($(window).scrollTop() + $(window).height()) == $(document).height()
        || agentID && ($(window).scrollTop() + $(window).height()) + 150 > $(document).height()) {
          // on effectue nos traitements
            if (wait === false){
                socket.emit('getSuggest', pageNumber);
                wait = true;
                pageNumber++;
            }
        }
    }); 
}
socket.on('sendSuggest', function(response){
    if (wait === true){
        wait = false;
        var searchResult = JSON.parse(response.searchResult);
        $.each(searchResult, function(index, movie) {
        	if (!movie.imdb){
        		movie.imdb = {};
        		movie.imdb.year = 'Unknow';
        		movie.imdb.rating = 'N/A';
        		movie.imdb.poster = '/images/no-poster.png';
        	}
            var snippet = '<div class="full-stream-view full-stream-view-hover">';
            snippet = snippet +  '<img class="profile-avatar" width="210" height="270" src="'+movie.imdb.poster+'" alt="Movie avatar">';
            snippet = snippet +  '<div class="short-rate"><span id="ratig-layer-1"></span></div><div class="short-rate" style="left: 0;right:inherit;"><span id="ratig-layer-1"></span></div><div class="short-rate" style="bottom:0;top:inherit;">';
            snippet = snippet +  '<span id="ratig-layer-1"><span class="no-rate rating" style="border-radius: 10px 0 0 0;background:#A4A709;font-size: 12px;font-weight: bold;padding: 2px 5px;">'+movie.imdb.rating+'</span></span></div>';
            snippet = snippet +  '<h3 class="mov-title"><a href="/movie/yts/'+movie.id+'"><div class=\'torrentTitle\'>'+movie.title+'</div></a></h3><div class="full-mask"><div class="full-mask-in"><h2><a href="/movie/yts/'+movie.id+'">'+movie.title+'</a></h2>';
            snippet = snippet +  '<div class="short-insider" style="text-align: center;"><div class=\'torrentYear\'><h5>'+movie.imdb.year+'</h5></div>';
            snippet = snippet +  '<h5><div class="torrentSeed">'+movie.seeders+'</div>seeders</h5>';
            snippet = snippet +  '<h5> <div class="torrentLeech">'+movie.leechers+'</div>leechers</h5>';
            snippet = snippet +  '<h6>Source : yts</h6></div><a class="fullink-info" href="/movie/yts/'+movie.id+'">Show</a></div></div></div>';
            $(snippet).appendTo( "#list" );
        }); 
    }
});
    
// <<<<filtres/tri>>>>>
var rateFtr = $('#rateFtr').slider();
var seedFtr = $('#seedFtr').slider();
var yearFtr = $('#yearFtr').slider();
$('input#rateFtr').change(function(){
    var $divs = $("div.full-stream-view");
    var minValue = rateFtr.slider('getValue')[0];
    var maxValue = rateFtr.slider('getValue')[1];
    $divs.each(function(movie){
        var rateA = $(this).find("span.rating").text();
        if (rateA < minValue || rateA > maxValue)
            $(this).hide();
        else
            $(this).show();
    });
});
$('input#yearFtr').change(function(){
    var $divs = $("div.full-stream-view");
    var minValue = yearFtr.slider('getValue')[0];
    var maxValue = yearFtr.slider('getValue')[1];
    $divs.each(function(movie){
        var yearA = $(this).find("div.torrentYear").text();
        if (yearA < minValue || yearA > maxValue)
            $(this).hide();
        else
            $(this).show();
    });
});
$('input#seedFtr').change(function(){
    var $divs = $("div.full-stream-view");
    var minValue = seedFtr.slider('getValue')[0];
    var maxValue = seedFtr.slider('getValue')[1];
    $divs.each(function(movie){
        var seedA = $(this).find("div.torrentSeed").text();
        if (seedA < minValue || seedA > maxValue)
            $(this).hide();
        else
            $(this).show();
    });
});
$('#alphBnt').on('click', function(){
    var $divs = $("div.full-stream-view");
    var alphOrderDivs = $divs.sort(function(a,b){
        var nameA = $(a).find("div.torrentTitle").text().toUpperCase();
        var nameB = $(b).find("div.torrentTitle").text().toUpperCase();
        if ($("#reverseBnt").is(':checked'))
            return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
        else
            return (nameB < nameA) ? -1 : (nameB > nameA) ? 1 : 0;
    });
    $("#list").html(alphOrderDivs);
});
$('#yearBnt').on('click', function(){
    var $divs = $("div.full-stream-view");
    var yearOrderDivs = $divs.sort(function(a,b){
        var yearA = $(a).find("div.torrentYear").text();
        var yearB = $(b).find("div.torrentYear").text();
        if ($("#reverseBnt").is(':checked'))
            return (yearA < yearB) ? -1 : (yearA > yearB) ? 1 : 0;
        else
            return (yearB < yearA) ? -1 : (yearB > yearA) ? 1 : 0;
    });
    $("#list").html(yearOrderDivs);
});
$('#rateBnt').on('click', function(){
    var $divs = $("div.full-stream-view");
    var rateOrderDivs = $divs.sort(function(a,b){
        var rateA = $(a).find("span.rating").text();
        var rateB = $(b).find("span.rating").text();
        if ($("#reverseBnt").is(':checked'))
            return (rateB < rateA) ? -1 : (rateB > rateA) ? 1 : 0;
        else
            return (rateA < rateB) ? -1 : (rateA > rateB) ? 1 : 0;
    });
    $("#list").html(rateOrderDivs);
});
$('#seedBnt').on('click', function(){
    var $divs = $("div.full-stream-view");
    var seedOrderDivs = $divs.sort(function(a,b){
        var seedA = $(a).find("div.torrentSeed").text();
        var seedB = $(b).find("div.torrentSeed").text();
        if ($("#reverseBnt").is(':checked'))
            return (seedA - seedB);
        else
            return (seedB - seedA);
    });
    $("#list").html(seedOrderDivs);
});
$('#leechBnt').on('click', function(){
    var $divs = $("div.full-stream-view");
    var leechOrderDivs = $divs.sort(function(a,b){
        var leechA = $(a).find("div.torrentLeech").text();
        var leechB = $(b).find("div.torrentLeech").text();
        if ($("#reverseBnt").is(':checked'))
            return (leechA - leechB);
        else
            return (leechB - leechA);
    });
    $("#list").html(leechOrderDivs);
});
