const models = require('../models');
const Promise = require('bluebird');
const utils = require('../lib/hashUtils');
const db = require('../db');

// helper function;

var generateUserID = function () {
  return Math.floor(Math.random() * (2000000000 - 1) + 1);
};


module.exports.createSession = (req, res, next) => {

  // if the request contains no cookies
  if (!req.cookies.shortlyid) {
    // then we must generate a new session hash
    models.Sessions.create()
      .then( (result) => {
        var primaryKey = result.insertId;
        models.Sessions.get({id: primaryKey})
          .then( (result) => {
            var hash = result.hash;
            req.session = {};
            req.session.hash = hash;
            res.cookie('shortlyid', hash);
            next();
          });
      });
  } else if (req.cookies.shortlyid) {
    models.Sessions.get({hash: req.cookies.shortlyid})
      .then ((result) => {
        req.session = {};
        req.session.hash = result.hash;
        if (result.userId) {
          req.session.userId = result.userId;
          models.Users.get({id: result.userId})
            .then((result) => {
              req.session.user.username = result.username;
              next();
            });
        } else {
          next();
        }
      });
  }
  // if the cookie hash does not match anything we have on the session table
  // then we create a new hash, store it on sessions table, it gets added to session object and the response has a new cookie
};

// possible solutions for above:
// var userId = generateUserID();
// // we need to create a session object on the request that contains the new hash
// var newSessionHash = utils.createHash(userId);
// we also want to add the session hash and userId to the session table in mysql
// db.query(`INSERT INTO sessions (hash, userId) VALUES ('${newSessionHash}', '${userId}')`);
//   resPromise = new Promise((resolve) => {

//     resolve(next);
//   });
//   resPromise.then( (next) => {
//     console.log('our next function', next);
//     console.log('does our res. have cookies', res.cookies);
//     return next();
//   });
//   return resPromise;

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

