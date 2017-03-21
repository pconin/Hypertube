"use strict";
let connection = require('../config/database');

module.exports = {
    add: function(user_id, source, movie_id, callback)
    {
        connection.query("INSERT INTO like (user_id, source, movie_id)VALUES(? , ? , ?)", [user_id, source, movie_id], function(err, result) {
            if(err)
            {
                console.log('Erreur SQL : models/like.js -> add');
                callback(null);
            }   
            else
            {
                callback(true);
            }
        });
    },
    
    del: function (user_id, source, movie_id, callback) {
        connection.query("DELETE FROM like WHERE user_id = ? AND source = ? AND movie_id = ?", [user_id, source, movie_id], function(err, result) {
            if (err)
            {
                console.log('Erreur SQL : models/like.js -> del');
                callback(null);
            }
            else
            {
                callback(true);
            }
        });
    },
    
    check: function(user_id, source, movie_id, callback) {
        connection.query("SELECT * FROM like WHERE user_id = ? AND movie_id = ? AND source = ?", [user_id, movie_id, source], function(err, result){
            if (err)
            {
                console.log('Erreur SQL : models/like.js -> check');
                callback(null);
            }
            else
            {
                if (result.length == 0)
                    callback(false);
                else
                    callback(true);
            }
        });  
    },
    
    auto: function(user_id, source, movie_id, callback)
    {
        this.check(user_id, source, movie_id, function(retour)
        {
            if (retour == true)
            {
                this.del(user_id, source, movie_id, function(retour2){
                    if (retour2 == true)
                        callback(false);
                });
            }else if (retour == false)
            {
                this.add(user_id, source, movie_id, function(retour3) {
                    if (retour3 == true)
                        callback(true);
                });
            }
            else
            {
                callback(null);
            }
        });
    }
};