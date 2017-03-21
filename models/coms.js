"use strict";
let connection = require('../config/database');

module.exports = {
    getByMovieId: function(source, movie_id, callback){
        connection.query('SELECT coms.*, users.photo, users.login, users.id as idunique FROM  coms INNER JOIN users ON users.id = coms.user_id WHERE coms.source = ? && coms.movie_id = ? ORDER BY coms.date DESC',[source, movie_id], function(err, commentaries) {
            if (err){
                console.log('Erreur database coms.js : ' + err);
                callback(null);
            }
            else{
                callback(commentaries);
            }
        });
    },
    
    addCom: function(contenu, movie_id, source, user_id, callback){
        connection.query('INSERT INTO coms (user_id, contenu, source, movie_id) VALUES (?,?,?,?)', [user_id, contenu, source, movie_id], function(err, result){
            if (err){
                console.log('Erreur ajout commentaire:' + err);
                callback('Erreur d\'ajout du commentaire dans la base de données');
            }
            else{
                callback(true);
            }
        });
    },
    
    delCom: function(user_id, com_id, callback){
        console.log('user id ' + user_id + 'com id ' + com_id);
        connection.query('DELETE FROM coms WHERE com_id = ? AND user_id = ?',[com_id, user_id], function(err, result) {
            if (err){
                console.log('Erreur suppression commentaire:' + err);
                callback('Vous ne pouvez pas supprimer ce commentaire');
            }
            else{
                callback(true);
            }
        });

    }
};
