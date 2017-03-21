var express = require('express');
var session = require('express-session');
var router = express.Router();
var Users = require("../models/users");
var check = require('../lib/check');
var history = require('../models/history');
var fs = require('fs');
var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');//attention a bien garder le nom langfr et langen

router.get('/', function(req, res, next) {
    if (req.session.login != null ) {
		var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
		history.list(req.session.idunique, function (err, rows){
			res.render('profile', {
			user : req.session,
			profile : req.session,
			text : lang,
			history : rows
			})
		})
        
		
	} else {
	    res.redirect('/');
	}
});



router.get('/compte',  function(req, res, next) {
	if (req.session.login != null ) {
		var notice = req.cookies.notice;
		res.clearCookie("notice");
		Users.find(req.session.idunique, function(err, row){
    		if (err == null)
    		{
				var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
	    		res.render('compte', {
			    user : req.session,
			    profile : row,
			    notice : notice,
			    text : lang
			    });	
    		}
    		else
    		{
			    console.log("error : ", err);
	    		res.redirect('/users/');
    		}
    		
    	});
	} else {
	    res.redirect('/');
	}
});


router.post('/comptepass',  function(req, res, next) {
    if (req.session.login != null ) {
    	if (req.session.provenance == 'local')
    	{
	    	var user = req.body;
	    	var error = false;
	    	if ((error = check.pwd2(user.passactuel, user.pass, user.passconf)))
	    	{
	            return res.redirect("/users/compte");
	    	}
	    	else
	    	{   
	    		Users.updatepass(req.session.idunique, user.passactuel, user.pass, user.passconf, function(err, error){
	    			if (err)
	    			{
				    	res.cookie('notice', 'Error : ' + error);
			            return res.redirect("/users/compte");
	    			}
	    			else
	    			{
						res.cookie('notice', error); //<----CETTE LIGNE POSE PROBLEME DES FOIS ! Error: Can't set headers after they are sent.
			            return res.redirect("/users/compte");
	    			}
	    		});
	    	}
    	}
    	else
    	{
    		return res.redirect('/users/compte');
    	}
	}
	else
	{
	    res.redirect('/');
	}
});

router.post('/changeimg', function(req, res, next) {
    var lang = check.choixlang(req.session.lang, langen, langfr); 
	res.clearCookie("notice");
	var error = false;
	var picture = req.files.picture;
	if ((error = check.img(picture))){
		console.log("check post image : ", error);
        res.cookie('notice', 'ERROR:' + error);
        return res.redirect("/users/compte");
	}
	else{
		var path = '/userimg/' +  req.session.login + Date.now() + '.jpg';
        picture.mv('./public' + path, function(err) {
            if (err) {
                res.status(500).send(err);
            }
            else{
				Users.picture(req.session.idunique, path, function(err, oldimg){
					if (err)
					{
				    	res.cookie('notice', 'Error : ' + err);
			            res.redirect("/users/compte");
					}
					else{
						if (oldimg && oldimg.slice(0, 5) === '/user') // si l'image est enregistree en local, on supprime l'ancienne
							fs.unlinkSync('./public' + oldimg);
						console.log("update image OK");
						req.session.photo = path;
						res.cookie('notice', lang.compte_update_ok);
				    	res.redirect("/users/compte");
					}
				});
			}
		});
	}
});

router.post('/compte',  function(req, res, next) {
    if (req.session.login != null ) {
    	var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
		res.clearCookie("notice");
    	var user = req.body;
    	var error = false;
    	if ((error = check.mail(user.mail)) || (error = check.name(user.lastname, user.firstname)) || (error = check.lang(user.lang)))
    	{
            console.log("check post compte : ", error);
            res.cookie('notice', 'ERROR:' + error);
            res.redirect("/users/compte");
    	}
    	else
    	{   
    		Users.compte(req.session.idunique, user.mail, user.firstname, user.lastname, user.lang, function(err){
    			if (err)
    			{
			    	res.cookie('notice', 'Error : ' + err);
		            res.redirect("/users/compte");
    			}
    			else
    			{
    				console.log("update compte OK");
	    			req.session.mail = user.mail;
				    req.session.firstname = user.firstname;
				    req.session.lastname = user.lastname;
				    req.session.lang = user.lang;
    
			    	res.cookie('notice', lang.compte_update_ok);
		            res.redirect("/users/compte");
    			}
    		});
    	}
	} 
	else {
		res.redirect('/');
	}
});

router.get('/all', function(req, res, next) {
    if (req.session.login != null)
    {
    	var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
    	Users.all2(function(rows){
    		res.render('all', {
    			user : req.session,
    			text : lang, 
    			profile : rows
    		})
    	});
    }
    else
    {
    	res.redirect('/');
    }
})

//http://expressjs.com/en/4x/api.html#req
router.get('/:id', function(req, res, next) {
    if (req.session.login != null ) {
    	var notice = req.cookies.notice;
		res.clearCookie("notice");
    	Users.find(req.params.id, function(err, row){
	    	if (err == null)
	    	{
				var lang = check.choixlang(req.session.lang, langen, langfr); //renvoie la langue choisie
    			//	console.log("ok : ", row);
	    		res.render('profile2', {
	    			user : req.session,
		    		profile : row, 
		    		notice : notice,
		    		text : lang
		    	});	
    		}
    		else
    		{
		    	console.log("error : ", err);
	    		res.redirect('/users/');
    				
    		}
    	});
	} else {
	    res.redirect('/');
	}
});

module.exports = router;