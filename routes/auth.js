var express = require('express');
var router = express.Router();
var passport = require('passport');
var Users = require("../models/users");
var check = require('../lib/check');
var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');//attention a bien garder le nom langfr et langen


//require les strategies pour passport
require("../controller/auth/42");
require("../controller/auth/insta");
passport.initialize();
passport.session();


router.get('/42', passport.authenticate('42'));


router.get('/42/callback', passport.authenticate('42', {failureRedirect: '/auth/auth_fail' }),
  function(req, res) {
    
    //mise en place de la session
    console.log("auth 42 id : ", req.user.row.id);
    req.session.idunique = req.user.row.id;
    req.session.login = req.user.row.login;
    req.session.mail = req.user.row.mail;
    req.session.ip = req.user.row.ip;
    req.session.photo = req.user.row.photo;
    req.session.provenance = req.user.row.provenance;
    req.session.refreshToken = req.user.row.refreshToken;
    req.session.accessToken = req.user.row.accessToken;
    req.session.firstname = req.user.row.firstname;
    req.session.lastname = req.user.row.lastname;
    req.session.lang = req.user.row.lang;
    req.session.user = req.user;
    
    console.log("\x1b[32m", req.session.firstname, " " , req.session.lastname , " vient de ce connecter via 42\x1b[0m");
    res.redirect('/');
  });
  
  
  router.get('/insta', passport.authenticate('instagram'));


router.get('/insta/callback', passport.authenticate('instagram', {failureRedirect: '/auth/auth_fail' }),
  function(req, res) {
    
    //mise en place de la session
    req.session.idunique = req.user.row.id;
    req.session.login = req.user.row.login;
    req.session.mail = req.user.row.mail;
    req.session.ip = req.user.row.ip;
    req.session.photo = req.user.row.photo;
    req.session.provenance = req.user.row.provenance;
    req.session.refreshToken = req.user.row.refreshToken;
    req.session.accessToken = req.user.row.accessToken;
    req.session.firstname = req.user.row.firstname;
    req.session.lastname = req.user.row.lastname;
    req.session.lang = req.user.row.lang;
    req.session.user = req.user;
    
    console.log("\x1b[32m", req.session.login, " vient de ce connecter via insctagram\x1b[0m");
    console.log("auth via insta");
    res.redirect('/');
  });
  

router.get('/auth_fail', function(req, res) {
    console.log("\x1b[31m CONNEXION ECHOUÉE\x1b[0m");
    res.redirect('/');
});


router.get('/register', function(req, res, next) {
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
   var notice = req.cookies.notice;
    res.clearCookie("notice");
    res.render('register', { 
      notice : notice,
      user:req.session,
      text:lang
   });
});


router.post('/register', function(req, res, next) {
    var error = null; 
    var user = req.body;
    var picture = req.files.picture;
    var lang = check.choixlang(req.session.lang, langen, langfr); 
    var login = user.login, mail=user.mail, password=user.password,passwordconf=user.passwordconf, nom=user.nom, prenom=user.prenom;
    if ((error = check.login(nom, prenom, login)) || (error = check.mail(mail)) || (error = check.img(picture)) || (error = check.pwd(password, passwordconf)) )
    {
        console.log(error);
        res.cookie('notice', 'ERREUR:' + error);
        return res.redirect('/auth/register');
    }
    else
    {
        var path = '/userimg/' +  login + Date.now() + '.jpg';
        picture.mv('./public' + path, function(err) {
            if (err) {
                res.status(500).send(err);
            }
            else{
                Users.createlocal(login, mail, password, prenom, nom, path, function(err){
                    if (err == true)
                    {
                        res.cookie('notice', lang.register_fail);
                        res.redirect('/auth/register');
                    }
                    else
                    {
                        res.cookie('notice', lang.register_good);
                        res.redirect('/');
                    }
                        
                        
                });
            }
        });
    }
});

router.get('/local', function(req, res, next) {
    var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
   var notice = req.cookies.notice;
    res.clearCookie("notice");
    res.render('login', { 
      notice : notice,
      user:req.session,
      text:lang
   });
});

router.post('/local', function(req, res, next) {
    var error = null; 
    var user = req.body;
    var login = user.login, password=user.password;
    if ((error = check.login2(login)) || (error = check.pwd(password, password)))
    {
        console.log(error);
        res.cookie('notice', 'ERREUR:' + error);
        return res.redirect('/');
    }
    else
    {
        Users.findlogin(login, password, 'local', function (err, user) {
            if (err) {
                console.log(err);
                res.cookie('notice', 'ERREUR:' + err);
                res.redirect("/");
            }
            else
            {
               // console.log(user);
                console.log("Sign In : ", user.login , " - ", user.mail);
                req.session.idunique = user.id;
                req.session.login = user.login;
                req.session.mail = user.mail;
                req.session.ip = user.ip;
                req.session.photo = user.photo;
                req.session.provenance = 'local';
                req.session.refreshToken = null;
                req.session.accessToken = null;
                req.session.firstname = user.firstname;
                req.session.lastname = user.lastname;
                req.session.lang = user.lang;
                req.session.user = user;
                //console.log(req.session);

             //   console.log(req.session);
                console.log("\x1b[32m", req.session.login, " vient de ce connecter via local\x1b[0m");
                res.redirect("/");
            }
        });
    }
});

router.post("/forgot", function(req, res, next) {
    var mail = req.body.mail;
    var error = null;
    
    if ((error = check.mail(mail)))
    {
        console.log("ERREUR : ", error)
        res.cookie('notice', 'ERREUR:' + error);
        return res.redirect('/');
    }
    else
    {
        Users.forgot(mail, function(err)
        {
            if (err)
            {
                console.log("ERREUR : ", err);
                res.cookie('notice', 'ERREUR:' + err);
                return res.redirect('/');  
            }
            else
            {
                console.log("forgot : ", mail);
                res.cookie('notice', 'Un mot de passe vous a etes envoyez pas mail');
                return res.redirect('/');
            }
        })
    }
});

module.exports = router;