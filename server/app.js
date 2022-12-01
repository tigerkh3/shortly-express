const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');
const Promise = require('bluebird');
const db = require('./db');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

// write our router controller methods

app.post('/login', function (req, res) {

  // first we get a post request from client trying to login
  var user = req.body.username;
  var attemptedPass = req.body.password;
  // req.body gives us access to user object
  // we have a req.body.username which is username inputted
  // probably need to check here if it exists or not
  db.query(`SELECT * FROM users WHERE username = '${user}';`, (err, data) => {
    if (err) {
      console.log('this is the error', err);
      res.redirect('/login');
    } else if (!data.length) {
      console.log('There is no user');
      res.redirect('/login');
    } else {
      var password = data[0].password;
      var salt = data[0].salt;
      // use compare method.
      if (models.Users.compare(attemptedPass, password, salt)) {
        // if it is successful we redirect to index
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    }
  });

});

app.post('/signup', function (req, res) {
  // grab the username and password, leave em as strings

  // create empty object
  var user = {};
  user.username = req.body.username;
  user.password = req.body.password;

  // call on a model method to create user account
  models.Users.create(user)
    .then((result) => {
      res.status(201).redirect('/').end('Account created successfully');
    })
    .catch((err) => {
      res.redirect('/signup').end('Username Already Exists');
    });

});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
