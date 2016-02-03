/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');

var config = require('./catdv_config');
var resumable = require('./libs/resumable-node.js')(config.temp_uploads);


var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var assets = require('connect-assets');

var dateUtils = require('date-utils');
var mkdirp = require('mkdirp');


/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');
var rssController = require('./controllers/rss');
var uploadController = require('./controllers/upload');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');

/**
 * Create Express server.
 */
var app = express();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 8082);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(assets({
  paths: ['public/css', 'public/js']
}));
// app.use(logger('dev'));
// app.use(favicon(path.join(__dirname, 'public/favicon.png')));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(expressValidator());
// app.use(methodOverride());
// app.use(cookieParser());
// app.use(session({
//   resave: true,
//   saveUninitialized: true,
//   secret: secrets.sessionSecret,
//   store: new MongoStore({ url: secrets.db, autoReconnect: true })
// }));
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());
// app.use(lusca({
//   csrf: false,
//   xframe: 'SAMEORIGIN',
//   xssProtection: true
// }));
// app.use(function(req, res, next) {
//   res.locals.user = req.user;
//   next();
// });
// app.use(function(req, res, next) {
//   if (/api/i.test(req.path)) req.session.returnTo = req.path;
//   next();
// });
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));


// /**
//  * Primary app routes.
//  */
// // app.get('/', homeController.index);
// app.get('/login', userController.getLogin);
// app.post('/login', userController.postLogin);
// app.get('/logout', userController.logout);
// app.get('/forgot', userController.getForgot);
// app.post('/forgot', userController.postForgot);
// app.get('/reset/:token', userController.getReset);
// app.post('/reset/:token', userController.postReset);
// app.get('/signup', userController.getSignup);
// app.post('/signup', userController.postSignup);
// app.get('/contact', contactController.getContact);
// app.post('/contact', contactController.postContact);
/**
 * Custom routes
 */
app.get('/', rssController.index);
app.get('/upload_form', uploadController.upload);
app.get('/rss/', rssController.index); // list of available rss feeds
app.get('/rss/feed', rssController.getRSS);
app.get('/rss/newItem', rssController.createItem);
app.post('/rss/newItem', rssController.postItem);
app.post('/rss/delete', rssController.deleteItem);
app.get('/rss/:id', rssController.getItem);


/**
 * Error Handler.
 */
app.use(errorHandler());


// Handle uploads through Resumable.js
app.post('/upload', multipartMiddleware, function(req, res){
  var fs = require('fs');
  var cache = [];
  var reqString  = JSON.stringify(req, function(key, value) {
    if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
        }
        // Store value in our collection
        cache.push(value);
    }
    return value;
  });
  cache = null; // Enable garbage collection
  fs.writeFile("req.txt", reqString );
    console.log(req); 
    var status = null;

    resumable.post(req, function(status, filename, original_filename, identifier){
        console.log('POST', status, original_filename, identifier);
        if(status === "done"){
          var fs = require('fs');
          var outpath = __dirname + '/Uploads/'
          var wstream = fs.createWriteStream( outpath + filename);
          mkdirp(outpath, function(err) { 
            if (err) return false;
            resumable.write(identifier, wstream, {onDone: function() {
              resumable.clean(identifier);
            }});
          });


        }

        res.send(status, {
            // NOTE: Uncomment this funciton to enable cross-domain request.
            //'Access-Control-Allow-Origin': '*'
        });
    });
});


// Handle cross-domain requests
// NOTE: Uncomment this funciton to enable cross-domain request.
/*
  app.options('/upload', function(req, res){
  console.log('OPTIONS');
  res.send(true, {
  'Access-Control-Allow-Origin': '*'
  }, 200);
  });
*/

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        console.log('GET', status);
        res.send((status == 'found' ? 200 : 404), status);
      });
  });

app.get('/download/:identifier', function(req, res){
  console.log('GET', req.params.identifier);
  resumable.write(req.params.identifier, res);
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});
module.exports = app;
