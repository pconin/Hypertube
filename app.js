var express = require('express');
var socket_io    = require("socket.io");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var sharedsession = require("express-socket.io-session"); // session socket
var fileUpload = require('express-fileupload');
var check = require('./lib/check');
var MySQLStore = require('express-mysql-session')(session);

// on recupere les modules de route dans une variable
var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var biblio = require('./routes/biblio'); // liste des torrents + searchbox
var movie = require('./routes/movie');
var stream = require('./routes/stream');

var app = express();

//express+socketio
var server = require('http').Server(app);
var io = require('socket.io')(server);

var options = {
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'rootroot',
    database: 'hypertube'
};
var sessionStore = new MySQLStore(options);
var session_params = session({
  secret: 'clefsecrete',
  store: sessionStore,
  resave:true,
  saveUninitialized: true,
  // Cookie Options 
  cookie : {maxAge: 12 * 60 * 60 * 1000} // 12 hours 
});
//on init cookie-session
app.use(session_params);

// view engine setup. on init pug, tous les fichiers.pug dans views sont accessibles
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev')); //combined or dev
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 },})); // obligatoirement apres les autres parser de body

//for use passport Auth
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req, res, next){
  res.io = io;
  next();
});

app.use('/', index);
app.use('/auth', function(req, res, next){
  if (req.session.idunique)
      res.redirect('/');
    else
      next();
}, auth);

app.use('/users', function(req, res, next){
  if (!req.session.idunique || !Number.isInteger(req.session.idunique))
      res.redirect('/');
    else
      next();
}, users);

app.use('/biblio', function(req, res, next){
  if (!req.session.idunique || !Number.isInteger(req.session.idunique))
      res.redirect('/');
    else
      next();
}, biblio);

app.use('/streaming', function(req, res, next){
  if (!req.session.idunique || !Number.isInteger(req.session.idunique))
      res.redirect('/');
    else
      next();
}, stream);

app.use('/movie', function(req, res, next){
  if (!req.session.idunique || !Number.isInteger(req.session.idunique))
      res.redirect('/');
    else
      next();
}, movie);

app.use('/logout', function(req, res) {
    //il faut aussi supprimer les cookies
    console.log("\x1b[32m", req.session.login, " vient de se deconnecter\x1b[0m");
    req.session.destroy(function () {
        res.redirect('/');
     });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = err.message;//req.app.get('env') === 'development' ? err : {};

// render the error page
res.status(err.status || 500);
res.render('error', { title: '404 error', message: 'This page doesn\'t exist, sorry'});
}); 



var configsocket = require("./routes/socket");
io.use(sharedsession(session_params));
configsocket(io);
module.exports = {app: app, server: server};
