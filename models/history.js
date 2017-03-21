"use strict";
let connection = require('../config/database');

module.exports = {
    add: function(id_user, id_movie, hebergeur, name, season, image){
        connection.query('SELECT * FROM history WHERE id_user = ? ORDER BY timestamp DESC', [id_user] ,function(err, row) {
            if (err){
                console.log('Erreur database history.js (1): ' + err);
                return(null);
            }
            else{
                if (row[0] && row[0].id_movie == id_movie)//si le dernier film est differant
                {
                    //console.log("le film est le meme");
                    return (null);
                    
                }
                else
                {
                    connection.query('INSERT INTO history VALUES (? , ? , ?, NOW() , ?, ?, ?)', [id_user, id_movie, hebergeur, name, image, season] ,function(err, row) {
                        if (err){
                            console.log("Erreur database history.js (2): " + err);
                            return (null);
                        }
                        else
                        {
                            return ('Ok');
                        }
                    });
                }
            }
        });
    }, 
    
    list: function (id_user, callback){
        connection.query("SELECT * FROM history WHERE id_user = ? ORDER BY timestamp DESC", [id_user], (err, rows) =>{
            if (err || rows.length == 0)
            {
                var rows = [];
                callback(true, rows);
            }
            else
            {
               callback(null, rows);
              // callback(null, rows.map((row) => new Users(row)))
            }
        });
    }
};