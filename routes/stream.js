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
var movieDataBase = require('../models/movie');
var torrentStream = require('torrent-stream');
var ffmpeg = require('fluent-ffmpeg');
var subtitle = require('../lib/subtitle');
var pump = require('pump');
var fs = require('fs');
var pug = require('pug');
//var streaming = require('../models/streaming');
var magnetLink = require('magnet-link')
 
router.get('/:source/:id', function(req, res, next){
    var movie_id = req.params.id;
    var source = req.params.source;
    var source2 = 'yts';
    if (source === 'pb'){
        source = 'pb';
        source2 = 'piratebay';
    }
    var dejaEntre3 = false;
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie

    console.log(movie_id + ' -- ' + source );

    movieDataBase.search(movie_id, source, function(isTorrentDownload){
        if (isTorrentDownload != null){
            

            var intervalId = setInterval(function(){
              //  console.log(intervalId);
            //il est deja en cour de DL
                movieDataBase.search(movie_id, source, function(movie){
                    console.log(movie.streamable);
                    if (movie.streamable == 'true' && dejaEntre3 == false)
                    {
                        dejaEntre3 = true;
                        //console.log('c\' est true');
                        clearInterval(intervalId);
                        var existSubtitle = {fr : false, en : false};
                        fs.access('./public/subtitles/' + source2 + movie_id + '.en.vtt', fs.constants.F_OK , (err) => {
                            if (!err)
                                existSubtitle.en = true;
                            fs.access('./public/subtitles/' + source2 + movie_id + '.fr.vtt', fs.constants.F_OK , (err) => {
                                if (!err)
                                     existSubtitle.fr = true;
                                console.log(existSubtitle);
                
                                req.session.streaming_source = 'pb';
                                req.session.streaming_movie_id = movie_id;
                                req.session.streaming_targetfile_path = isTorrentDownload.path;
                                

                                var fn = pug.compileFile('./views/streaming.pug');
                                res.writeHead(206, {"Content-Type" : "text/html"});
                                res.write(fn({
                                    text: lang,
                                    movie_id: movie_id,
                                    source : source,
                                    existSubtitle : existSubtitle,
                                    engsub:'/subtitles/' + source2 + movie_id + ".en.vtt",
                                    frsub: '/subtitles/' + source2 + movie_id + '.fr.vtt'
                                }))
                                res.end();
                            });
                        });
                    }
                });
            }, 8000);
        }
        else{
            if (source === 'pb'){

                PirateBay
                    .getTorrent(movie_id)
                    .then(function(results){ 
                        //console.log(results);
                        if (results.name.length != 0 && results.id)
                        {
                            var total = 0;
                            var name;
                             
                            var engine = torrentStream(results.magnetLink, {
                                connections : 500,
                                uploads: 30,
                                tmp: 'public/torrents',//root folder for the files storage
                               // path: 'public/movies',
                                path: 'public/movies',
                                verify: true,
                                dht: true, 
                                tracker: true
                            });
                            
                            engine.on('ready', function() {
                                var targetfile = null;
                                var indexProcess = 0;
                                // on parse les fichiers du torrent
                                engine.files.forEach(function(file) {
                                    // on selectionne le plus gros fichier video
                                    file.deselect();
                                    if ((file.name.slice(-4) === '.mkv' || file.name.slice(-4) === '.mp4'  || file.name.slice(-4) === '.avi') && (!targetfile || targetfile.length < file.length)){
                                        targetfile = file;
                                        console.log('filename:', file.name, 'filepath', file.path, 'file size', file.length);
                                    }
                                    indexProcess++;
                                    console.log(indexProcess + 'fichiers traités / ' + engine.files.length + 'fichiers totaux');
                                    if (indexProcess === engine.files.length){
                                        if (targetfile){
                                            targetfile.select();
                                            engine.remove(targetfile, function(){console.log('Remove files');});
                                            var ext = targetfile.name.substr(file.name.length - 4); // ligne inutile?
                                            total = targetfile.length;
                                            name = targetfile.name;
                                            console.log('targetfilename:', targetfile.name, 'targetfilepath', targetfile.path, 'targetfile size', targetfile.length);

                                            movieDataBase.add(movie_id, source, targetfile.path, function(err){
                                                if (err == true)
                                                {
                                                    //ajout ok on demare le stream
                                                    targetfile.createReadStream();
                                           
                                            //test pour n'afficher que les bon sous titre

                                                    var existSubtitle = {fr : false, en : false};
                                                    fs.access('./public/subtitles/piratebay' + movie_id + '.en.vtt', fs.constants.F_OK , (err) => {
                                                        if (!err)
                                                            existSubtitle.en = true;
                                                        fs.access('./public/subtitles/piratebay' + movie_id + '.fr.vtt', fs.constants.F_OK , (err) => {
                                                            if (!err)
                                                                 existSubtitle.fr = true;

                                                            console.log(existSubtitle);
                                                            req.session.streaming_source = 'pb';
                                                            req.session.streaming_movie_id = movie_id;
                                                            req.session.streaming_targetfile_path = targetfile.path;

                                                            var dejaEntre2 = false;

                                                            res.writeHead(206, {"Content-Type" : "text/html"});
                                                            engine.on('download', function(piece_index) {
                                                                var pourcentage = Math.trunc((engine.swarm.downloaded / total) * 1000);
                                                                var pourcentage2 = Math.trunc((engine.swarm.downloaded / total) * 100);
                                                                console.log((pourcentage2), "% - (", engine.swarm.downloaded, '/', total, ') -- ', name);

                                                                
                                                                //quand on arrive à 5% on lance le streaming
                                                                if (dejaEntre2 == false && pourcentage >= 100)
                                                                {
                                                                    console.log('streaming a 10%');
                                                                    dejaEntre2 = true;
                                                                    movieDataBase.streamable(movie_id, source, function(){
                                                                        var fn = pug.compileFile('./views/streaming.pug');
                                                                        res.write(fn({
                                                                            text: lang,
                                                                            movie_id: movie_id,
                                                                            source : 'pb',
                                                                            existSubtitle : existSubtitle,
                                                                            engsub:'/subtitles/piratebay' + movie_id + ".en.vtt",
                                                                            frsub: '/subtitles/piratebay' + movie_id + '.fr.vtt'
                                                                        }))
                                                                        res.end();
                                                                    });
                                                                    //res.redirect('/movie/'+ source + '/' + movie_id + '#movie');
                                                                    
                                                                }
                                                            });        
                                                        });
                                                    }); 

                                                 }
                                                });
                                                }
                                        // si on a pas trouvé de fichier video au bon format
                                        else{
                                            console.log('Erreur, aucun fichier vidéo / format incompatible');
                                            res.cookie('notice', 'Erreur, aucun fichier vidéo / format incompatible');
                                            return res.redirect('/movie/'+ source + '/' + movie_id + '#movie');
                                        }
                                    }
                                });
                            });
                           
                            engine.on('idle', function() { //quand le download est fini
                                console.log('Download fini');
                                movieDataBase.done(movie_id, source);
                            });
                        }
                        else
                        {
                            console.log('download incorrect pb');
                            res.cookie('notice', 'Erreur, cette video n\'est plus disponible');
                            return res.redirect('/biblio');
                        }
                    })
                    .catch(function(err) {
                        if (err){
                            console.log('erreur piratebay api, id introuvable');
                            res.cookie('notice', 'Erreur, cette référence n\'est pas disponible');
                            return res.redirect('/biblio');
                        }
                    });
            }
            else if (source === 'yts'){
                var ytsSearchUrl = 'https://yts.ag/api/v2/movie_details.json?movie_id='+movie_id+'&with_images=true&with_cast=true';
                https.get(ytsSearchUrl, function(response) {
                    var body = '';
                    response.on('data', function(d) {
                        body += d;
                    });
                    response.on('end', function() {
                        if (body !== ''){
                            var parsedResult = JSON.parse(body);
                            if (parsedResult.status === 'ok' && parsedResult.data.movie.id && parsedResult.data.movie.torrents[0]){
                                
                                magnetLink(parsedResult.data.movie.torrents[0].url, function (err, magnetlink) {
                                  // you got a magnet link from a remote torrent file 
                                    if (err){
                                        console.log('erreur magnet link: ' + err);
                                        res.cookie('notice', 'Erreur, le torrent est corrompu');
                                        return res.redirect('/movie/'+ source + '/' + movie_id);
                                    }
                                    var total = 0;
                                    var name;
                                    var engine = torrentStream(magnetlink, {
                                        connections : 500,
                                        uploads: 30,
                                        tmp: 'public/torrents',//root folder for the files storage
                                       // path: 'public/movies',
                                        path: 'public/movies',
                                        verify: true,
                                        dht: true, 
                                        tracker: true
                                    });
                                
                                    engine.on('ready', function() {
                                        var targetfile = null;
                                        var indexProcess = 0;
                                        // on parse les fichiers du torrent
                                        engine.files.forEach(function(file) {
                                            // on selectionne le plus gros fichier video
                                            file.deselect();
                                            if ((file.name.slice(-4) === '.mkv' || file.name.slice(-4) === '.mp4'  || file.name.slice(-4) === '.avi') && (!targetfile || targetfile.length < file.length)){
                                                targetfile = file;
                                                console.log('filename:', file.name, 'filepath', file.path, 'file size', file.length);
                                            }
                                            indexProcess++;
                                            console.log(indexProcess + 'fichiers traités / ' + engine.files.length + 'fichiers totaux');
                                            if (indexProcess === engine.files.length){
                                                if (targetfile){
                                                    targetfile.select();
                                                    engine.remove(targetfile, function(){console.log('Remove files');});
                                                    var ext = targetfile.name.substr(file.name.length - 4); // ligne inutile?
                                                    total = targetfile.length;
                                                    name = targetfile.name;
                                                    console.log('targetfilename:', targetfile.name, 'targetfilepath', targetfile.path, 'targetfile size', targetfile.length);
                                                   
                                                    
                                                    movieDataBase.add(movie_id, source, targetfile.path, function(err){
                                                        if (err == true)
                                                        {   
                                                            //lance le DL du torrent
                                                            targetfile.createReadStream();
                                                            //test pour n'afficher que les bon sous titre
                                                            var existSubtitle = {fr : false, en : false};
                                                            fs.access('./public/subtitles/yts' + movie_id + '.en.vtt', fs.constants.F_OK , (err) => {
                                                                if (!err)
                                                                    existSubtitle.en = true;
                                                                fs.access('./public/subtitles/yts' + movie_id + '.fr.vtt', fs.constants.F_OK , (err) => {
                                                                    if (!err)
                                                                         existSubtitle.fr = true;
                                                                    console.log(existSubtitle);
                                                                    req.session.streaming_source = 'yts';
                                                                    req.session.streaming_movie_id = movie_id;
                                                                    req.session.streaming_targetfile_path = targetfile.path;
                                                                    var dejaEntre2 = false;



                                                                    res.writeHead(206, {"Content-Type" : "text/html"});
                                                                    engine.on('download', function(piece_index) {
                                                                        var pourcentage = Math.trunc((engine.swarm.downloaded / total) * 1000);
                                                                        var pourcentage2 = Math.trunc((engine.swarm.downloaded / total) * 100);
                                                                        console.log((pourcentage2), "% - (", engine.swarm.downloaded, '/', total, ') -- ', name);
                                                                         
                                                                        //quand on arrive à 5% on lance le streaming
                                                                        if (dejaEntre2 == false && pourcentage >= 100)
                                                                        {
                                                                            console.log('streaming a 10%');
                                                                            dejaEntre2 = true;
                                                                            movieDataBase.streamable(movie_id, source, function(){
                                                                                var fn = pug.compileFile('./views/streaming.pug');
                                                                                
                                                                                res.write(fn({
                                                                                    text: lang,
                                                                                    movie_id: movie_id,
                                                                                    source : 'pb',
                                                                                    existSubtitle : existSubtitle,
                                                                                    engsub:'/subtitles/yts' + movie_id + ".en.vtt",
                                                                                    frsub: '/subtitles/yts' + movie_id + '.fr.vtt'
                                                                                }))
                                                                                res.end();
                                                                            });
                                                                        }
                                                                    });        
                                                                });
                                                            }); 

                                                        }
                                                    });
                                                }
                                                // si on a pas trouvé de fichier video au bon format
                                                else{
                                                    console.log('Erreur, aucun fichier vidéo / format incompatible');
                                                    res.cookie('notice', 'Erreur, aucun fichier vidéo / format incompatible');
                                                    return res.redirect('/movie/'+ source + '/' + movie_id + '#movie');
                                                }
                                            }
                                        });
                                    });
                                   
                                    engine.on('idle', function() { //quand le download est fini
                                        console.log('Download fini');
                                        movieDataBase.done(movie_id, source);
                                    });
                                });
                            }
                            else
                            {
                                console.log('download incorrect yts');
                                res.cookie('notice', 'Erreur, cette video n\'est plus disponible');
                                return res.redirect('/movie/'+ source + '/' + movie_id);
                            }
                        }
                        else
                        {
                            console.log('download incorrect yts');
                            res.cookie('notice', 'Erreur, cette video n\'est plus disponible');
                            return res.redirect('/movie/'+ source + '/' + movie_id);
                        }
                    });
                });
            }
            else
            {
                res.cookie('notice', 'Erreur, Seulement piratebay ou yts');
                return res.redirect('/movie/'+ source + '/' + movie_id);
            }
            
        }
    });
});

router.get('/video', function(req, res, next){

    console.log('VIDEO EN STREAMING !!!!!!!!!!');

        if (req.session.streaming_movie_id){
                //res.writeHead(200, {"Content-Type" : "text/html"});

                //faire un file_existe pour eviter les erreurs
                //suppression des variable de session

                    
                   // console.log(req.session.streaming_targetfile_path);
                   // console.log(req.session);
                    var path = './public/movies/' + req.session.streaming_targetfile_path;

                    req.session.streaming_movie_id = null;
                    req.session.streaming_source = null;
                    req.session.streaming_targetfile_path = null;

                    console.log(path);
                    var stream = fs.createReadStream(path);


                    var command = ffmpeg(stream) //ouvrir le stream avec fsreadstream
                    .videoCodec('libvpx')
                    .audioCodec('libvorbis')
                    .format('webm')
                    .audioBitrate(128)
                    .videoBitrate(1024)
                    .size('1024x?')

                    .outputOptions([
                        //'-vf subtitles=./jellies.srt' //incruste dans la video, c' est pas ce qu' on veux
                        '-threads 8',
                        '-deadline realtime',
                        '-error-resilient 1'
                    ])

                    .on('start', function(cmd){
                        console.log(cmd)
                    })
                    .on('error', function(err){
                        console.log(err.message);
                    })
                    //.run();
                    pump(command, res);
                    //movieDataBase.add(movie_id, source, path, null);


                    
    }
    else
    {
        res.cookie('notice', 'Merci de selectionner un film');
        res.redirect('/biblio');
    }


});

module.exports = router;