//https://www.npmjs.com/package/opensubtitles-api
//https://github.com/vankasteelj/opensubtitles-api

var http = require('https');
var fs = require('fs');
var srt2vtt = require('srt2vtt');


var download = function(url, dest, cb) {
    if (!fs.existsSync(dest + '.vtt')) {
    // Do something
       // console.log(' DOWNLOAD : url:' + url + 'dest : ' + dest);
        var file = fs.createWriteStream(dest + '.srt');
        var request = http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();  // close() is async, call cb after close completes.
                if (fs.existsSync(dest+'.srt'))
                {
                    var srtData = fs.readFileSync(dest + '.srt');
                    srt2vtt(srtData, function(err, vttData) {
                        if (err) {
                            fs.unlinkSync(dest + '.vtt');
                            throw new Error(err);
                        }
                        fs.writeFileSync(dest + '.vtt', vttData);
                        fs.unlinkSync(dest + '.srt');
                    });
                }
            });
        })
        .on('error', function(err) { // Handle errors
            fs.unlink(dest + '.srt'); // Delete the file async. (But we don't check the result)
            if (cb) console.log('erreur download: ' + err.message);
        });
    }
};



const OS = require('opensubtitles-api');
const OpenSubtitles = new OS({
    useragent:'OSTestUserAgentTemp',
    username: 'Hypertube-42',
    password: 'Hypertube-42',
    ssl: true
});


module.exports = {
    addSerie: function(season, episode, source, movie_id, imdbid) {
        if (source == 'pb')
            source = 'piratebay';
        OpenSubtitles.search({
            sublanguageid: 'fre',
            extensions: ['srt'],
            season: season,
            episode: episode,
            limit: 3,
            imdbid: imdbid,
            fps: '23.96',
        }).then(subtitles => {
            if (subtitles.fr){
                download(subtitles.fr[0].url, 'public/subtitles/' + source + movie_id + '.fr');
            }
            else{
                //console.log (' Pas de sous-titres francais');
            }
            //callback(subtitles);
            
        }).catch(err => {
            console.log('erreur opensubtitles api: ' + err);
        });

        OpenSubtitles.search({
            sublanguageid: 'eng',
            extensions: ['srt'],
            season: season,
            episode: episode,
            limit: 3,
            imdbid: imdbid,
            fps: '23.96',
        }).then(subtitles => {
            if (subtitles.en){
                download(subtitles.en[0].url, 'public/subtitles/' + source + movie_id + '.en');
            }
            else{
                //console.log('Pas de sous-titres anglais');
            }
        }).catch(err => {
            console.log('erreur opensubtitles api: ' + err);
        });
    },
    
    addMovie: function(imdbid, movie_id, source) {
        if (source == 'pb')
            source = 'piratebay';
        //console.log('Search subtitles: imdbid:' + imdbid);
        OpenSubtitles.search({
            sublanguageid: 'fre',
            extensions: ['srt'],
            limit: 3,
            imdbid: imdbid,
            fps: '23.96',
        }).then(subtitles => {
            if (subtitles.fr){
                download(subtitles.fr[0].url, 'public/subtitles/' + source + movie_id + '.fr');
            }
            else{
               // console.log('Pas de sous-titres francais');
            }
        }).catch(err => {
            console.log('erreur opensubtitles api: ' + err);
        });
        OpenSubtitles.search({
            sublanguageid: 'eng',
            extensions: ['srt'],
            limit: 3,
            imdbid: imdbid,
            fps: '23.96',
        }).then(subtitles => {
            if (subtitles.en){
                download(subtitles.en[0].url, 'public/subtitles/' + source + movie_id + '.en');
            }
            else{
               // console.log('Pas de sous-titres anglais');
            }
        }).catch(err => {
            console.log('erreur opensubtitles api: ' + err);
        });
    }
};