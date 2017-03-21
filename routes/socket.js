var https = require('https');
const imdb = require('imdb-api');

var ytsSearcher = function (pageNumber, callback){
    var searchResult = [];
    var ytsSearchUrl = 'https://yts.ag/api/v2/list_movies.jsonp?query_term=&page=' + pageNumber;
    https.get(ytsSearchUrl, function(response) {
            //console.log(response);
                var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('error', function(e){
               console.log('Erreur requete http yts: ' + e.message);
               return callback(searchResult);
            });
            response.on('end', function() {
                var parsedResult;
                try {
                    parsedResult = JSON.parse(body);
                } catch(e){
                    console.log('Erreur http yts: ' + e.message);
                    return callback(searchResult);
                }
                
                var indexYts = 0;
                // on verifie que la requete renvoit le bon statut
                if (parsedResult.status === 'ok' && parsedResult.data.movies){
                    parsedResult.data.movies.forEach(function(torrent){
                            var movie = {}; // declare l'objet movie
                            movie.biblio = 'yts';
                            movie.title = torrent.title; movie.id = torrent.id; 
                            movie.link = torrent.url
                            if (torrent.torrents){
                                movie.size = torrent.torrents[0].size;
                                movie.seeders = torrent.torrents[0].seeds;
                                movie.leechers = torrent.torrents[0].peers;
                                movie.uploadDate = torrent.torrents[0].date_uploaded;
                                movie.magnet = torrent.torrents[0].url;
                                movie.hash = torrent.torrents[0].hash;
                                
                                movie.info = 'yts';
                                movie.img = torrent.medium_cover_image;
                                movie.imdb = {};
                                
                                movie.isView = 0;
                                imdb.getById(torrent.imdb_code)
                                .catch(err => {var hey = err;
                                    indexYts++;
                                    if (indexYts === parsedResult.data.movies.length)
                                        return callback(searchResult);
                                    else
                                        console.log('Yts imdb error'); 
                                })
                                .then(results => {
                                    indexYts++;
                                    //console.log('YTS imdb ok');
                                    movie.imdb = results;
                                    searchResult.push(movie);
                                    if (indexYts === parsedResult.data.movies.length)
                                        return callback(searchResult);
                                    
                                    
                                });
                               
                            }
                    });
                }
                else
                    return callback(searchResult);
            });
        });
};

module.exports = function (io) {
    io.on('connection', function (socket) {
    	socket.on('getSuggest', function(pageNumber){
    		if (pageNumber < 0 || pageNumber > 300){
    			console.log('wrong');
    			return ;
    		}
    		else{
                ytsSearcher(pageNumber, function(searchResult){
                    return socket.emit('sendSuggest', {response:'Suggestion number : ' + pageNumber, searchResult: JSON.stringify(searchResult)});
                });
    		}
    	});

    });
};