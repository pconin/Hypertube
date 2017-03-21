var passport = require('passport');
var InstagramStrategy = require('passport-facebook').Strategy;
var configAuth = require('../../config/auth'); //charge les codes pour api
var Users = require("../../models/users");

passport.use(new InstagramStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log("TENTATIVE DE CONNEXION facebook ");
     // Users.findOrCreate(profile, cb);
     console.log("profile :", profile);
    
    Users.findOrCreate(profile.username, "NONE", null, 'facebook', accessToken, refreshToken, profile.name.givenName, profile.name.familyName, "NONE", function (err, user) {
     //console.log(user);
     return cb(err, user);
    });
    
//    return cb(null, profile);
  }
));

passport.serializeUser(function(user, done) {
 done(null, user.id);
});


passport.deserializeUser(function(id, done) {
    done(null, id);
});

module.exports = 'auth';

