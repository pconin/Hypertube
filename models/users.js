"use strict";
let connexion = require('../config/database');
var bcrypt = require('bcrypt');
var configAuth = require('../config/auth');
var lib = require("../lib/lib");
var check = require("../lib/check");
var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');//attention a bien garder le nom langfr et langen


//https://github.com/timjrobinson/nodejsmodels/blob/master/user.js
class Users {
    
    constructor (row) {
        //console.log("user row = ", row);
        this.row = row;
    }
    
    get id () {
        return this.row.id;
    }
    
    get login () {
        return this.row.login;
    }
    
    get mail () {
        return this.row.mail;
    }
    
    get prenom () {
        return this.row.firstname;
    }
    
    get nom () {
        return this.row.lastname;
    }
    
    get ip () {
        return this.row.ip;
    }
    
    get photo () {
        return this.row.photo;
    }
    
    get firstname () {
        return this.row.firstname;
    }

    get lastname () {
        return this.row.lastname;
    }

    get lang () {
        return this.row.lang;
    }
    
static updatepass(id, passactuel, pass, passconfirm, cb)
{
    this.whatlangid(id, function(err, lang){
        //ne sert pas a grand chose ici de verifier l'err de whatlangid vu qu'il renvois fr en cas de probleme
        var lang = check.choixlang(lang, langen, langfr); //renvoie la langue choisie
        connexion.query("SELECT pass FROM users WHERE id = ? AND provenance = 'local'", [id], (err, row) => {
           if (err || row.length == 0)
                cb(true, err);
            else
            {
                if (bcrypt.compareSync(passactuel, row[0].pass) == true)
                {
                    //le bon mdp, on peu update
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(pass, salt);
                    connexion.query("UPDATE users SET pass = ? WHERE id = ? AND provenance = 'local'", [hash, id], (err, row) => {
                        if (err || row.length == 0)
                            cb(true, err);
                        else
                        {
                            cb(null, lang.compte_update_pass_ok);
                        }
                    });
                }
                else
                {
                    //error
                    cb(true, lang.compte_update_pass_current);
                }
               
            }
        });
    });
        
}

static whatlangid(id, callback){
    connexion.query("SELECT lang FROM users WHERE id = ?", [id], (err, rows) => {
        if (err || rows.length == 0)
        {
            //si il y a une erreur, on donne la langue par defaut (anglais, voir pdf) mais on precise l'erreur
            callback(err, 'en');
        }
        else
        {
            if (rows[0].lang == 'fr')
                callback (null, 'fr');
            else
                callback(null, 'en');
        }
    });
}

static whatlanglogin(login, callback){
    connexion.query("SELECT lang FROM users WHERE login = ?", [login], (err, rows) => {
        if (err || rows.length == 0)
        {
            //si il y a une erreur, on donne la langue par defaut (Anglais, voir pdf) mais on precise l'erreur
            return callback(err, 'en');
        }
        else
        {
            if (rows[0].lang == 'fr')
                return callback (null, 'fr');
            else
                return callback(null, 'en');
        }
    });
}

static uniquemail(mail, id, cb)
{
    connexion.query("SELECT id FROM users WHERE mail = ? AND id != ?", [mail, id], (err, rows) => {
        if (err || rows.length > 0)
        {
            return cb("l'addresse mail existe deja");
        }
        else
        {
            return cb(null);
        }
    });
}

static compte(id, mail, firstname, lastname, lang, cb)
{
    console.log(id, mail, firstname, lastname);
    this.uniquemail(mail, id, function(err){
        if (err)
        {
            return cb(err);
        }
        else
        {
            connexion.query("UPDATE users SET mail = ? , firstname = ? , lastname = ? , lang = ? WHERE id = ?", [mail, firstname, lastname, lang, id], (err, rows) => {
                if (err || rows.length == 0)
                {
                    console.log(err);
                    cb("Update problem, sorry : ");
                }
                else
                {
                    cb (null);
                }
            });
        }
    });
}

static picture(id, picture, cb)
{
    connexion.query('SELECT photo FROM users WHERE id = ?', [id], (err, oldimg) => {
        if (err)
        {
            console.log(err);
            cb ('Update problem, sorry', null);
        }
        else{
            console.log('Old image path: ' + JSON.stringify(oldimg[0]));
            connexion.query("UPDATE users SET photo = ? WHERE id = ?", [picture, id], (err, rows) => {
                if (err || rows.length == 0)
                {
                    console.log(err);
                    cb("Update problem, sorry : ", null);
                }
                else
                {
                    if (oldimg[0])
                        cb (null, oldimg[0].photo);
                    else
                        cb(null, null);
                }
            });
        }
    });
}

static forgot (mail, cb)
{
    console.log("forgot (" , mail , ")");
    //check si mail existe
    connexion.query("SELECT * FROM users WHERE mail = ? AND provenance='local' LIMIT 1", [mail], (err, rows) => {
        if (err || rows.length == 0) 
        {
            console.log(err);
            cb('adresse mail introuvable');
        }
        else
        {
            //si il existe
            var newpwd = check.newpwd();
            //hash du mdp
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(newpwd, salt);
             connexion.query("UPDATE users SET pass = ? WHERE mail = ? AND provenance='local' LIMIT 1", [hash, mail], (err, rows) => {
                 if (err || rows.length == 0)
                 {
                     console.log(err);
                     cb('Probleme avec la mise a jour du mot de passe');
                 }
                 else
                 {
                    var message = "Bonjour! Voici votre mot de passe temporaire: " + newpwd + ' Vous pouvez vous connecter avec et changer de mot de passe. Hello! Here is your your temporary password: ' + newpwd + ' You can login and change it in your account settings';
                    var sujet = 'hypertube - Mail de reinitialisation';
                    lib.sendMail(mail, sujet, message, null);
                    cb(null);
                 }
             });
            
            
        }
    });
    
}

  
static create (login, mail, password, provenance, accessToken, refreshToken, firstname, lastname, photo, cb)
    {
        //console.log("Create (", login, ", ", mail, ", ", password, ", ", provenance, ", ", accessToken, ", ", refreshToken, ", " , firstname , ", " , lastname, ", ", photo , ")");
        connexion.query('SELECT * FROM users WHERE mail = ? AND provenance = ?', [mail, provenance], (err, result) => {
            if (err || result.length > 0)
            {
                console.log("Ce mail est deja utilise");
                cb(true);
            }
            else
            {
                if (password)
                {
                    //hash du mdp
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(password, salt);
                    password = hash;
                
                }
                connexion.query('INSERT INTO users SET login =?, mail =?, pass=?, provenance =?, accessToken =?, refreshToken =?, firstname = ?, lastname = ?, photo=?, lang = "en"', [login, mail, password, provenance, accessToken, refreshToken, firstname, lastname, photo], (err, result) => {
                    if (err || result.length == 0)
                    {
                        console.log(err);
                       // throw err;
                    }
                    cb(false);
                });
            }
        });
        
    }
    
    static createlocal (login, mail, password, firstname, lastname, photo, cb)
    {
        connexion.query("SELECT * FROM users WHERE (mail = ? OR login = ?) AND provenance = 'local'", [mail, login], (err, result) => {
            if (err || result.length > 0)
            {
               // console.log("Ce user or mail est deja utiliser");
                cb(true);
            }
            else
            {
                //hash du mdp
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(password, salt);
                
                
                connexion.query("INSERT INTO users SET login =?, mail =?, pass=?, provenance = 'local', firstname = ?, lastname = ?, photo=?, lang = 'en'", [login, mail, hash, firstname, lastname, photo], (err, result) => {
                    if (err || result.length == 0)
                    {
                     //   console.log(err);
                        cb(true);
                       // throw err;
                    }
                    else
                        cb(false);
                });
            }
        });
        
    }
    
    /*
    static all (cb) {
        console.log("all()");
        connexion.query('SELECT * FROM users', (err, rows) => {
            if (err) 
                throw err;
            cb(null, rows.map((rows) => new Users(rows)));
        });
    }
  */  
    static all2 (cb) {
        //console.log("all2()");
        connexion.query('SELECT * FROM users ORDER BY id DESC', (err, rows) => {
            if (err) 
                throw err;
            else
                cb(rows);
        });
    }
    
    static find (id, cb) {
        console.log("find (", id, ")");
        connexion.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id], (err, rows) => {
            if (err) 
                throw err;
            //console.log(rows.length);
            if (rows.length == 0)
                cb("not found", null);
            else
                cb(null, new Users(rows[0]));//premier enregistrement
        });
    }
    
    static findlogin (login, password, provenance, cb) {
        console.log("findlogin(", login ," " , password, " " , provenance , ")");
        connexion.query('SELECT * FROM users WHERE login = ? AND provenance=? LIMIT 1', [login, provenance], (err, rows) => {
        if (err  || rows.length == 0) 
        {
          //  console.log("utilisateur introuvable #122");
            cb("utilisateur introuvable #122", null);
        }
        else if (provenance === 'local')
        {
          //  console.log("local #123");
            //hash du mdp
            if (bcrypt.compareSync(password, rows[0].pass) == true)
            {
               // console.log(rows[0]);
              //  console.log("local #126");
                cb(null, new Users(rows[0]));
            }
            else
            {
              //  console.log("local #127");
                cb("password incorrect", null);
            }
                 
        }
        else
            cb(null, new Users(rows[0]));
        });
    }
    
   static findOrCreate(login, mail, password, provenance, accessToken, refreshToken, firstname, lastname, photo, callback){
      // console.log("findOrCreate (", login, ", ", mail, ", ", password, ", ", provenance, ", ", accessToken, ", ", refreshToken, ", " , firstname , ", " , lastname, ", ", photo , ")");
        connexion.query("SELECT *, COUNT(*) as nb FROM users WHERE login = ? AND provenance = ?", [login, provenance], (err, rows) =>
        {
            if (err)
            {
                console.log(err);
                //throw err;
                callback(err, null);
            }
            else if (rows[0].nb > 0)
            {
                //utilisateur trouver, check mdp
                if (rows[0].provenance === 'local')
                {
                    if (bcrypt.compareSync(password, rows[0].pass) == true)
                    {
                       // console.log("local #128");
                        callback(null, new Users(rows[0]));
                    }
                    else
                    {
                      // console.log("local #129");
                       callback("Ce compte existe deja, connectez vous", null);
                    }
                }
                else
                    callback(null, new Users(rows[0]));
            }
            else
            {
                //jamais connecter, creation dans la bdd;
                this.create(login, mail, password, provenance, accessToken, refreshToken, firstname, lastname, photo, function(err){
                    //console.log("callback create #250");
                   // console.log(err);
                    if (err)
                    {
                        callback("l'adresse mail existe deja", null);
                    }
                    else
                    {
                     //   console.log(login);
                        Users.findlogin(login, password, provenance, callback);
                    }
                        
                    });
                
            }
        });
    }
}

module.exports = Users;
