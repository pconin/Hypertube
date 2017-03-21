var https = require('https');
const PirateBay = require('thepiratebay');
const imdb = require('imdb-api');
var torrentParser = require('torrent-name-parser');
var history = require('../../models/history');

// parser du site archive

var pirateSuggest = function(history, search, searchResult, callback){
        var searchIndex = 0;
        // methode pour recuperer les 100 meilleurs torrents verifiés
        PirateBay.topTorrents(200, {filter: {verified: true}})
            .then(results => { // on parse le resultat et on l'entre dans le tableau searchResult
                if (!results)
                    return callback(searchResult);
                results.forEach(torrent => {
                    var movie = {};
                                                    movie.isView = 0;
                    //on complete l'objet movie avec les donnees
                    movie.biblio = 'piratebay';
                    movie.title = torrent.name; movie.id = torrent.id; movie.size = torrent.size; movie.link = torrent.link;
                    movie.seeders = torrent.seeders; movie.leechers = torrent.leechers; movie.uploadDate = torrent.uploadDate;
                    movie.magnet = torrent.magnetLink; movie.imdb = {};
                    
                    // on associe à la recherche la fiche imdb si elle existe
                    var imdbSearch = torrentParser(torrent.name);
                    
                    imdb.getReq({ name: imdbSearch.title}, (err, things) => {
                        if (err){var hey = err;
                            searchIndex++;
                            if (searchIndex === results.length){
                                return callback(searchResult);
                            }
                        }
                        else{
                            movie.imdb = things;
                            movie.info = imdbSearch;
                            for(var i = 0, len = history.length; i < len; i++) {
                                if (history[i].id_movie === movie.id && history[i].hebergeur === 'pb') {
                                    movie.isView = 1;
                                    break;
                                }
                            }
                            if (torrent.seeders >= 17) // pour eviter les torrents morts
                                searchResult.push(movie);
                            searchIndex++;
                            if (searchIndex === results.length){
                                return callback(searchResult);
                            }
                            // on ajoute l'objet au tableau    
                        }
                    });
                    
                    
                });
            })
            .catch(function(err){ console.log(err);
                return callback(searchResult);}); 
};

var pirateSearcher = function(history, search, searchResult, callback){
    var searchIndex = 0;

        PirateBay.search(search, {
              category: 200,
              filter: {verified: true},
              orderBy: 'seeds',
            })
            .then(results => { // on parse le resultat et on l'entre dans le tableau searchResult
                if (results.length == 0)
                    ytsSearcher(history, search,searchResult, callback);
                results.forEach(torrent => {
                    var movie = {};
                    //on complete l'objet movie avec les donnees
                                                    movie.isView = 0;

                    movie.biblio = 'piratebay';
                    movie.title = torrent.name; movie.id = torrent.id; movie.size = torrent.size; movie.link = torrent.link;
                    movie.seeders = torrent.seeders; movie.leechers = torrent.leechers; movie.uploadDate = torrent.uploadDate;
                    movie.magnet = torrent.magnetLink; movie.imdb = {};
                    
                    // on associe à la recherche la fiche imdb si elle existe
                    var imdbSearch = torrentParser(torrent.name);
                    searchIndex++;
                    imdb.getReq({ name: imdbSearch.title}, (err, things) => {
                        if (err){var hey = err;
                            }
                        else{
                            movie.imdb = things;
                            movie.info = imdbSearch;
                            for(var i = 0, len = history.length; i < len; i++) {
                                if (history[i].id_movie === movie.id && history[i].hebergeur === 'pb') {
                                    movie.isView = 1;
                                    break;
                                }
                            }
                            if (torrent.seeders >= 17) // pour eviter les torrents morts
                                searchResult.push(movie);

                            // on ajoute l'objet au tableau
                            
                            
                        }
                    });
                    if (searchIndex === results.length){
                        return ytsSearcher(history, search,searchResult, callback);
                    }
                    
                });
            })
            .catch(function(err){ console.log(err);
                return ytsSearcher(history, search,searchResult, callback);});
    
};

// parser du site yts
var ytsSearcher = function (history, search, searchResult, callback){
    var ytsSearchUrl = 'https://yts.ag/api/v2/list_movies.jsonp?query_term=' + search;
    //console.log(ytsSearchUrl);
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
                            console.log('yts' + torrent.title);
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
                                
                                for(var i = 0, len = history.length; i < len; i++) {
                                    if (history[i].id_movie === movie.id && history[i].hebergeur === 'yts') {
                                        console.log('Film deja vu');
                                        movie.isView = 1;
                                        break;
                                    }
                                }
                                imdb.getById(torrent.imdb_code)
                                .catch(err => {var hey = err;
                                    indexYts++;
                                    if (indexYts === parsedResult.data.movies.length)
                                        return callback(searchResult);
                                    console.log('Yts imdb error'); 
                                })
                                .then(results => {
                                    indexYts++;
                                    //console.log('YTS imdb ok');
                                    movie.imdb = results;
                                    if (movie.seeders > 12) 
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

module.exports = {
    searcher: function(search, idunique, callback){
        var searchResult = []; // on init le tableau resultats
        if (search === '' || !search){
            history.list(idunique, function(error, history){
                pirateSuggest(history, search, searchResult, function(searchResult){
                    callback(searchResult);
                });
            });
        }

        else{
            history.list(idunique, function(error, history){
                pirateSearcher(history, search, searchResult, function(searchResult){
                    callback(searchResult);
                });
            });
        }
    },
    
};