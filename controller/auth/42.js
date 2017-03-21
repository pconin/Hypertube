var passport = require('passport');
var FortyTwoStrategy = require('passport-42').Strategy;
var configAuth = require('../../config/auth'); //charge les codes pour api
var Users = require("../../models/users");

passport.use(new FortyTwoStrategy({
    clientID: configAuth.Auth42.clientID,
    clientSecret: configAuth.Auth42.clientSecret,
    callbackURL: configAuth.Auth42.callbackURL,
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log("TENTATIVE DE CONNEXION 42 ");
     // Users.findOrCreate(profile, cb);
     // console.log("profile :", profile);
    
    Users.findOrCreate(profile.username, profile.emails[0].value, null, '42', accessToken, refreshToken, profile.name.givenName, profile.name.familyName, profile.photos[0].value, function (err, user) {
     //console.log(user);
     return cb(err, user);
    });
    
    //return cb(null, profile);
  }
));

passport.serializeUser(function(user, done) {
 done(null, user.id);
});


passport.deserializeUser(function(user, done) {
  done(null, user);
});

module.exports = 'auth';

