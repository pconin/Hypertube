var express = require('express');
var router = express.Router();

var check = require('../lib/check');
var langfr = require('../lang/fr.json');//attention a bien garder le nom langfr et langen
var langen = require('../lang/en.json');
var searcher = require('../controller/biblio/searcher');

router.get('/', function(req, res, next) {
    var notice = req.cookies.notice;
    res.clearCookie("notice");
    var lang = check.choixlang(req.session.lang, langen, langfr); 
    
    // on parse la recherche
    var search = req.query.search;
    console.log(req.query);
    if (!search)
        search = '';
    searcher.searcher(search, req.session.idunique, function(searchResult){
        res.render('biblio', {
            title: 'Bibliothèque des torrents',
            user:req.session,
            searchResult:searchResult,
            search: search,
            nbResult:searchResult.length, // nombre de torrents trouvés
            notice: notice,
            text:lang
        });
    });
});

module.exports = router;
