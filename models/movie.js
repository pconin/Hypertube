"use strict";
let connexion = require('../config/database');
let rimraf = require('rimraf');
var fs = require('fs');

module.exports = {
    search: function(movie_id, source, callback){
        this.deltime(function(err){
            if (source === 'piratebay')
                source === 'pb';
            console.log('search ' + movie_id);
            var d = new Date();
            var n = (d.getTime() / 1000);
            var timestamp = Math.trunc( n ); //date actuel
            //pas besoin de check err
            connexion.query('SELECT * FROM movies WHERE movie_id = ? AND source = ?', [movie_id, source], function(err, movie){
                if (err || !movie[0]){
                    console.log('Aucun film trouvé');
                    callback(null);
                }
                else{
                    console.log('Film trouvé dans la DB');
                    console.log(timestamp);
                    if (fs.existsSync('./public/movies/' + movie[0].path)) {
                        connexion.query('UPDATE movies SET timestamp = ? WHERE movie_id = ? AND source = ?', [timestamp, movie_id, source], function(err) {
                            if (err)
                                console.log('Probleme SQL movie->search->update : ' + err);
                            return callback(movie[0]);
                        });
                    }
                    else{ // pas reussi a tester
                        connexion.query("DELETE FROM movies WHERE movie_id = ? AND source = ?", [movie_id, source], function(err) {
                            if (err){
                                console.log('Erreur suppression de la db' + err);
                                    callback(null);
                            }
                            else{
                                console.log('Film connu dans la db mais supprimé du serveur');
                                return callback(null);
                            }
                        });
                    }

                }
            });
        });
    },

    streamable: function(movie_id, source, callback){
        connexion.query('UPDATE movies SET streamable="true" WHERE movie_id = ? AND source = ?', [movie_id, source], function(err) {
            if (err){
                console.log("probleme update streamable movie");
            }
            callback();
        })
    },
    
    add: function(movie_id, source, path, callback){
        var d = new Date();
        var n = (d.getTime() / 1000);
        var timestamp = Math.trunc( n ); 
        this.search(movie_id, source, function(movie){
            if (movie == null)
            {
                connexion.query('INSERT INTO `movies`(`source`, `movie_id`, `path`, `timestamp`) VALUES (?, ?, ?, ?)', [source, movie_id, path, timestamp], function(err){
                    if (err){
                        console.log('Probleme d\'ajout du film dans la BDD');
                        if (callback != null)
                            callback(false);
                    }
                    else{
                        console.log('Film ajouter');
                        if (callback != null)
                            callback(true);
                    }
                });
            }
            else
            {
                console.log('film deja present');
                if (callback != null)
                    callback('present');
            }
        });
        
    },
    
    done: function(movie_id, source){ //pas de callback
        connexion.query('UPDATE movies SET done="true" WHERE movie_id = ? AND source = ?', [movie_id, source], function(err) {
            if (err){
                console.log("probleme update done movie");
            }
        })
        
    },
    
    deltime: function(callback){
        var d = new Date();
        var n = (d.getTime() / 1000);
        var timestamp = Math.trunc( n ); //date actuel
        var onemonth = timestamp - (60 * 60 * 24 * 30);
        
        //faut aussi les supprimer sur le serveur 
        //https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback
        connexion.query("SELECT * FROM movies WHERE timestamp < ?", [onemonth], function(err, rows) {
            if (err)
                console.log('Probleme SQL movie->deltime->select : ' + err);
            else
            {
                rows.forEach(function (elem){
                    console.log(elem.movie_id + ' - ' + elem.path);
                    var path = elem.path.split('/');
                    console.log(path);
                    rimraf('../public/movies/' + path[0], function () { console.log('suppression des films de 1 mois'); });
                    
                });
                connexion.query("DELETE FROM movies WHERE timestamp < ?", [onemonth], function(err) {
                if  (err){
                    console.log('Probleme suppression movies 1 mois');
                    if (callback != null)
                        callback(false);
                }
                else
                {
                    if (callback != null)
                        callback(true);
                }
                });
            }
        })
        
    }
    
    
};