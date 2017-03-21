var express = require('express');
var router = express.Router();
var check = require('../lib/check');
var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');//attention a bien garder le nom langfr et langen

/* GET home page. */
router.get('/', function(req, res, next) {
    var lang = check.choixlang(req.session.lang, langen, langfr);
    var notice = req.cookies.notice;
    res.clearCookie("notice");
    res.render('index', {
        title: 'HyperTube',
        notice:notice,
        user:req.session,
        text:lang
    });
});

module.exports = router;
