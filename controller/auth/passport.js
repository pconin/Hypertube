var User        = require("../models/users");
var passport    = require("passport");
   // local       = require("./local");
//var facebook    = require("./facebook");
//    google      = require("./passports/google"),
var    fortytwo    = require("./42");
var    instagram    = require("./insta");

module.exports = function () {

    passport.serializeUser(function (user, callback) {
        callback(null, user._id);
    });

    passport.deserializeUser(function (id, callback) {
        User.findOne({_id: id}, function (err, user) {
            if (err)
                return callback(err);
            else
                return callback(null, user);
        });
    });

  /*  passport.use(local);
    
    passport.use(google);
    
  */ 
  passport.use(instagram);
  passport.use(fortytwo);
 // passport.use(facebook);
};