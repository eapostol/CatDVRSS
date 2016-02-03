/**
 * GET /
 * Home page.
 */

var http = require('http');
var when = require('when');
var config = require('../catdv_config');

var catdv_url = config.catdv_url;
var catdv_port = config.catdv_port;
var catdv_user = config.catdv_user;
var catdv_pwd = config.catdv_pwd;
var catdv_pubkey = '';
var jsessionid = null;

//** NOTE catdv's provided library wont work because its client-side js requiring jquery
//var CatDV = require('../libs/catdv-api');
function login_catdv( callback , failed_callback){
  var options = {
    host: catdv_url,
    port: catdv_port,
    //path: '/api/4/session?usr='+catdv_user+'&epwd='+encryptPwd(catdv_pwd, catdv_pubkey), // encryption function not working
    path: '/api/4/session?usr='+catdv_user+'&pwd='+catdv_pwd, // not encrypted but doesnt matter once its running on same server (will be localhost)
    //path: '/api/info',
    method: 'GET'
  };
  if( jsessionid !== null ){
    return callback("Already Logged in");
  } 
  else console.log("no sess id logging in");
  var request = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try{
        body = JSON.parse(chunk);
      }
      catch ( error ){
        console.log(chunk);
        return failed_callback(error);
      }
      if(body.status === "OK"){
      jsessionid = body.data.jsessionid;
        callback();
      }
      else {
        failed_callback(body.errorMessage);
      }
    });
    res.on('error', function(e) {
      console.log('problem with request login_catdv: ' + e.message);
    });
  });
  request.end();
  request.on("error", function(e){
      // ECONNRESET error is triggered here...
      console.info(e);
  });
}

function getPubKey( callback ){
  var options = {
    host: catdv_url,
    port: catdv_port,
    path: '/api/4/session/key',
    method: 'GET'
  };
  var request = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (body) {
      catdv_pubkey = JSON.parse(body).data.key;
      // console.log('pubkey: ' + catdv_pubkey);
    callback(catdv_pubkey);
    });
    res.on('error', function(e) {
      console.log('problem with request getPubKey: ' + e.message);
    });
  });
  request.end();
  request.on("error", function(e){
      // ECONNRESET error is triggered here...
      console.info(e);
  });
}

//http://www.squarebox.com/server7-password-encryption/
function encryptPwd(pwd, pubkey){

  //http://userpages.umbc.edu/~rcampbel/NumbThy/Class/Programming/JavaScript/#PowMod
  function powmod(base,exp,modulus)
  {
    var accum=1, i=0, basepow2=base;
    while ((exp>>i)>0) {
       if(((exp>>i) & 1) == 1){accum = (accum*basepow2) % modulus;};
       basepow2 = (basepow2*basepow2) % modulus;
     i++;
    };
    return accum;
  }

  //  c = powMod(m, e, n);

  //  e,n  -  the two large integer components of the public RSA key.
  //  m    -  the message converted to a large integer.
  //  c    -  the encrypted message as a large integer.

  return powmod( decodeURIComponent(escape(pwd)), pubkey.split(":")[0], pubkey.split(":")[1]);
}

// function getCatalogs(callback){
//     var options = {
//       host: catdv_url,
//       port: catdv_port,
//       path: '/api/4/catalogs;jsessionid='+jsessionid, //or((clip.recordedDate)newer(172800))', // OFF -- extra 0 for testing  OR &desc=recordedDate&take=50', // 
//       method: 'GET'
//     };
//     var request = http.request(options, function(res) {
//       var body = '';
//       res.setEncoding('utf8');
//       res.on('data', function (res) {
//         body += res
//       });
//       res.on('end', function(){
//         var deferreds = [];
//         var clipsData = JSON.parse(body).data.items
//         for (index in clipsData) {
//           deferreds.push(getClip(clipsData[index].ID));
//       }

//       when.all(deferreds).then(function () {
//         callback();
//       });
//       })
//       res.on('error', function(e) {
//         console.log('problem with request get Clips: ' + e.message);
//       });
//     });
//     request.end();
//     request.on("error", function(e){
//         // ECONNRESET error is triggered here...
//         console.info(e);
//     });
//   }


function getCatalogs(callback, failed_callback){
  var options = {
      host: catdv_url,
      port: catdv_port,
      path: '/api/4/catalogs;jsessionid='+jsessionid, //or((clip.recordedDate)newer(172800))', // OFF -- extra 0 for testing  OR &desc=recordedDate&take=50', // 
      method: 'GET'
  };
  var request = http.request(options, function(res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('data', function (res) {
      body += res
    });
    res.on('end', function(){
      if(res.statusCode == "200"){
        var jsondata = null
        try{
          jsondata = JSON.parse(body).data;
        }
        catch (error){
          console.log("failed to parse response");
          return failed_callback(body);
        }
        if( jsondata == null ) {
          jsessionid = null;
          return failed_callback(jsondata);
        }
        callback(catalogs = jsondata );
      }
      else {
        // console.log(body)
        failed_callback(body);
      }   
    })
    res.on('error', function(e) {
      console.log('problem with request get catalogs: ' + e.message);
    });
  });
  request.end();
  request.on("error", function(e){
      // ECONNRESET error is triggered here...
      console.info("catalog request error");
      failed_callback(e);
  });
}

exports.upload = function(req, res) {
  login_catdv(function(){
    getCatalogs( function(catalogs){
      // console.log(catalogs);
      res.render('upload', {
        title: 'MasterCat Upload Bridge', catalogs: catalogs
      });
    })
  })
};