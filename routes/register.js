var express = require('express');
var router = express.Router();
var lib = require('../lib/lib');
var check = require('../lib/check'); //fonctions de check
var pool = require('../config/database'); //co db
var bcrypt = require('bcrypt'); //hash password 

var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');//attention a bien garder le nom langfr et langen

router.get('/register', function(req, res, next) {
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
   var notice = req.cookies.notice;
    res.clearCookie("notice");
    res.render('register', { 
      notice : notice,
      title: 'Register',
      user:req.session,
      text:lang
   });
});

router.get('/login', function(req, res, next) {
   var notice = req.cookies.notice;
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
    res.clearCookie("notice");
    res.render('login', { 
      notice : notice,
      title: 'login',
      user:req.session,
      text:lang
   });
});


// verification des entrées
router.post('/register', function(req, res, next) {
    console.log("POST REGISTER");
    var error = null; 
    var user = req.body.user; //transfere de req vers des variables, et on hash les passwords
    var login = user.login, mail=user.mail, password=user.password,passwordconf=user.passwordconf, nom=user.nom, prenom=user.prenom, picture = req.files.picture;
    if ((error = check.img(picture)) || (error = check.name(nom, prenom, login)) || (error = check.mail(mail)) || (error = check.password(password, passwordconf)))
    {
        console.log(error);
        res.cookie('notice', 'ERREUR:' + error);
        return res.redirect('/users/register');
    }
    else
    {
        pool.getConnection(function(err,connection){
            if (err) {
                res.json({"code" : 100, "status" : "Error in connection database"});
                return ;
            }
            else{
                console.log('ID de connection a la db:' + connection.threadId);
                connection.query('SELECT * FROM `hypertube`.`users` WHERE mail=? OR login=?',[mail, login], function(err, result) {
                    if (err) { return res.json({"code" : 100, "status" : "Probleme dans la requete register"});}
                    else if (result.length > 0){
                        res.cookie('notice', 'ERREUR: Le mail ou le login existe deja');
                        connection.release();
                        return res.redirect('/users/register');
                    }
                    else{
                        password = bcrypt.hashSync(password, 12);
                        var path = '/public/userimg/' +  req.session.login + Date.now() + '.jpg';
                        picture.mv('.' + path, function(err) {
                            if (err) {
                                res.status(500).send(err);
                            }
                            else{
                                connection.query('INSERT INTO `hypertube`.`users` (login, mail, pass, photo, provenance, firstname, lastname, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [login, mail, password, path, 'local', nom, prenom, 'fr'], function(error, results) {
                                if (err) { return res.json({"code" : 100, "status" : "Probleme dans la creation d'user dans la db"});}
                                    else{
                                        res.cookie('notice', 'Votre compte a bien été créé');
                                        connection.release();
                                        return res.redirect('/users/login');
                                        }
                                    });
                            }
                        });
                    }
                 });
            }
        });
    }
});

module.exports = router;
