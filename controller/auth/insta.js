var passport = require('passport');
var InstagramStrategy = require('passport-instagram').Strategy;
var configAuth = require('../../config/auth'); //charge les codes pour api
var Users = require("../../models/users");

passport.use(new InstagramStrategy({
    clientID: configAuth.instaAuth.clientID,
    clientSecret: configAuth.instaAuth.clientSecret,
    callbackURL: configAuth.instaAuth.callbackURL,
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log("TENTATIVE DE CONNEXION INSTAGRAM ");
     //Users.findOrCreate(profile, cb);
        
    Users.findOrCreate(profile.username, "NONE", null, 'instagram', accessToken, refreshToken, profile.name.givenName, profile.name.familyName, profile._json.data.profile_picture, function (err, user) {
      return cb(err, user);
    });
    
    //return cb(null, profile);
  }
));

passport.serializeUser(function(user, done) {
 done(null, user.id);
});


passport.deserializeUser(function(id, done) {
    done(null, id);
});

module.exports = 'auth';

