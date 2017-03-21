var express = require('express');
var router = express.Router();
const PirateBay = require('thepiratebay');
const imdb = require('imdb-api');
var https = require('https');
var torrentParser = require('torrent-name-parser');
var magnetLink = require('magnet-link');
var coms = require('../models/coms'); 
var check = require('../lib/check');
var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');//attention a bien garder le nom langfr et langen
var history = require('../models/history');
var movieDataBase = require('../models/movie');
var torrentStream = require('torrent-stream');
var ffmpeg = require('fluent-ffmpeg');
var subtitle = require('../lib/subtitle');
var pump = require('pump');
var fs = require("fs");
var rimraf = require('rimraf');
var like = require("../models/like");

router.get('/yts/:id', function(req, res, next) {
    var notice = req.cookies.notice;
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
    res.clearCookie("notice");
    
    movieDataBase.deltime(null);
    var yts_id = req.params.id;
    var ytsSearchUrl = 'https://yts.ag/api/v2/movie_details.json?movie_id='+yts_id+'&with_images=true&with_cast=true';
    https.get(ytsSearchUrl, function(response) {
                var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {
                if (body !== ''){
                    var parsedResult = JSON.parse(body);
                    if (parsedResult.status === 'ok' && parsedResult.data.movie.id){
                        var data = parsedResult.data;
                        var movie = data.movie;
                        movie.id = yts_id;
                        movie.source = 'yts';
                        movie.biblio = 'yts';
                        movie.imdb = {};
                        movie.info = {};
                        if (movie.torrents){
                                movie.size = movie.torrents[0].size;
                                movie.seeders = movie.torrents[0].seeds;
                                movie.leechers = movie.torrents[0].peers;
                                movie.uploadDate = movie.torrents[0].date_uploaded;
                                movie.magnet = movie.torrents[0].url;
                                movie.hash = movie.torrents[0].hash;
                        }
                        else
                            movie.uploadDate = 'Torrent indisponible'; // gestion d'erreur transitoire
                       
                        // recuperation de la fiche imdb
                        imdb.getById(movie.imdb_code)
                            .catch(err => {var hey = err; 
                                console.log('error imdb api');
                                res.cookie('notice', 'La fiche IMDB n\'est pas disponible actuellement');
                            })
                            .then(function(results){
                                    movie.imdb = results;
                        subtitle.addMovie(movie.imdb_code, yts_id, 'yts');

                        //on met dans l'historique
                        if (req.session.idunique)
                          history.add(req.session.idunique, yts_id, 'yts', movie.title, null, movie.large_cover_image);


                       var existSubtitle = {fr : false, en : false};
                                fs.access('./public/subtitles/yts' + yts_id + '.en.vtt', fs.constants.F_OK , (err) => {
                                    if (!err)
                                        existSubtitle.en = true;
                                    fs.access('./public/subtitles/yts' + yts_id + '.fr.vtt', fs.constants.F_OK , (err) => {
                                        if (!err)
                                             existSubtitle.fr = true;
                            
                        // recuperation des commentaires
                                            coms.getByMovieId('yts', yts_id, function(commentaries){
                                                res.render('movie', {
                                                    notice:notice,
                                                    title: movie.title,
                                                    user:req.session,
                                                    movie:movie,
                                                    coms:commentaries,
                                                    genres:movie.genres,
                                                    text:lang,
                                                    existSubtitle: existSubtitle
                                                });
                                            });
                                        });
                                });
                            });
                        
                            
                    }
                    else{
                        console.log('Erreur, YTS ID inconnu');
                        res.cookie('notice', 'Erreur, nous n\'avons pas pu trouver les informations de ce torrent');
                        res.redirect('/biblio');
                    }
                }
                else{
                    console.log('erreur requete http, url yts: ', ytsSearchUrl);
                    res.cookie('notice', 'Erreur, cette reference n\'est pas disponible');
                    res.redirect('/biblio');
                }
            });
    });

});

router.get('/pb/:id', function(req, res, next) {
    var notice = req.cookies.notice;
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
    res.clearCookie("notice");
    var pb_id = req.params.id;
    movieDataBase.deltime(null);
    PirateBay
        .getTorrent(pb_id)
        .then(function(results){ 
            if (results.name.length != 0 && results.id)
            {
                var movie = {};
                movie = results;
                movie.biblio = 'piratebay';
                movie.info = torrentParser(movie.name);
                movie.id = pb_id;
                movie.source = 'pb';
                
                // recuperation des commentaires
                coms.getByMovieId('piratebay', pb_id, function(commentaries){
                    if (!commentaries)
                        commentaries = [];
                    
                    // recuperation de la fiche imdb
                    imdb.get(movie.info.title)
                        .catch(err => {var hey = err; 
                                console.log('error imdb api');
                            })
                            .then(function(results){
                                movie.imdb = results;
                                
                                if (movie.imdb)
                                {
                                    if (movie.imdb.poster)
                                        var historyUrl = movie.imdb.poster;
                                    else
                                        var historyUrl = "/images/no-poster.png";
                                    if (movie.info.season)
                                        subtitle.addSerie(movie.info.season, movie.info.episode, 'pb', pb_id, movie.imdb.imdbid);
                                    else
                                        subtitle.addMovie(movie.imdb.imdbid, pb_id, 'pb');
                                }
                                else{
                                    movie.imdb = {};
                                }
                                if (movie.info.season)
                                   var historySeason = "Saison " + movie.info.season + " Episode " + movie.info.episode;
                                    
                                //console.log(movie);
                                if (req.session.idunique)
                                    history.add(req.session.idunique, pb_id, 'pb', movie.info.title, historySeason, historyUrl);
                                    
                                //test pour n'afficher que les bon sous titre
                                var existSubtitle = {fr : false, en : false};
                                fs.access('./public/subtitles/piratebay' + pb_id + '.en.vtt', fs.constants.F_OK , (err) => {
                                    if (!err)
                                        existSubtitle.en = true;
                                    fs.access('./public/subtitles/piratebay' + pb_id + '.fr.vtt', fs.constants.F_OK , (err) => {
                                        if (!err)
                                             existSubtitle.fr = true;
                                       // console.log(existSubtitle);
                                        
                                        
                                        movieDataBase.search(pb_id, 'pb', function (found){
                                             res.render('movie', {
                                                notice: notice,
                                                title: 'PirateBay Movie',
                                                user:req.session,
                                                movie:movie,
                                                mediastream:found,
                                                coms: commentaries,
                                                nbComs: commentaries.length,
                                                text:lang,
                                                existSubtitle: existSubtitle
                                            });
                                        });
                                
                                
                                    });
                                    
                                });
                            });
                });
            }
            else
            {
                console.log('Erreur, piratebay ID inconnu');
                res.cookie('notice', 'Erreur, nous n\'avons pas pu trouver les informations de ce torrent');
                res.redirect('/biblio');
            }
        })
        .catch(function(err) {
            if (err){
                console.log('erreur piratebay api, id introuvable');
                res.cookie('notice', 'Erreur, cette référence n\'est pas disponible');
                res.redirect('/biblio');
            }
        });

     
});


router.post('/addCom', function(req,res,next){
    var contenu = req.body.com_contenu;
    var movie_id = req.body.movie_id;
    var source = req.body.movie_source;
    if (source === 'piratebay')
        var redsource = 'pb';
    else
        var redsource = 'yts';
    if (!req.session.idunique){
        res.cookie('notice', 'Vous devez d\'abord vous connecter');
        return res.redirect('/movie/'+ redsource + '/' + movie_id);
    }
    if (contenu.length > 150){
        res.cookie('notice', 'Le commentaire doit faire moins de 150 caracteres');
        res.redirect('/movie/'+ redsource + '/' + movie_id);
    }
    coms.addCom(contenu, movie_id, source, req.session.idunique, function(response){
        if (source === 'piratebay')
            source = 'pb';
        if (response == true){
            res.redirect('/movie/'+ redsource + '/' + movie_id);
        }
        else{
            console.log('Erreur : ' + response);
            res.cookie('notice', response);
            res.redirect('/movie/'+ redsource + '/' + movie_id);
        }
    });
    return ;
});

router.post('/delCom', function(req, res, next){
    var com_id = req.body.com_id;
    var movie_id = req.body.movie_id;
    var source = req.body.movie_source;
    if (!req.session.idunique){
            res.cookie('notice', 'Vous devez d\'abord vous connecter');
            return res.redirect('/movie/'+ source + '/' + movie_id);
    }
    coms.delCom(req.session.idunique, com_id, function(response){
        if (source === 'piratebay')
                source = 'pb';
      if (response == true){
          console.log('Commentaire supprimé');
            res.redirect('/movie/'+ source + '/' + movie_id);
      } 
      else{
            console.log('Erreur : ' + response);
            res.cookie('notice', response);
            res.redirect('/movie/'+ source + '/' + movie_id);
      }
   });
});

router.post('/like', function(req,res,next){
    var movie_id = req.body.movie_id;
    var source = req.body.movie_source;
    if (source === 'piratebay')
        var redsource = 'pb';
    else
        var redsource = 'yts';
    if (!req.session.idunique){
        res.cookie('notice', 'Vous devez d\'abord vous connecter');
        return res.redirect('/movie/'+ redsource + '/' + movie_id);
    }
    
    like.auto(req.session.idunique, source, movie_id, function(result){
        if (result == null)
        {
            console.log('Erreur : route/movie.js -> POST like');
            res.cookie('notice', 'Erreur, like probleme');
        }
        else
        {
            if (result == true)
            {
                console.log('Like ajouté au film: ' + movie_id);
                res.cookie('notice', 'Like ajouté');
            }
            else
            {
                console.log('like supprimer au film: ' + movie_id);
                res.cookie('notice', 'Like supprimer');
            }
            return res.redirect('/movie/' + redsource + '/'+ movie_id);
        }
    });
});



module.exports = router;