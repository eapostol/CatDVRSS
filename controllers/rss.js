/**
 * GET /rss/BreakingNews
 * Breaking News rss feed.
 */

var RSS = require('rss');
var http = require('http');
var when = require('when');
var config = require('../catdv_config');

var catdv_url = config.catdv_url;
var catdv_port = config.catdv_port;
var catdv_user = config.catdv_user;
var catdv_pwd = config.catdv_pwd;
var catdv_pubkey = '';
var jsessionid = '';

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
	var request = http.request(options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	  	body = JSON.parse(chunk);
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

function generateRSS(res){


	function getClipsFromCat(catalogID, num, callback){
		var options = {
		  host: catdv_url,
		  port: catdv_port,
		  path: '/api/4/clips;jsessionid='+jsessionid+'?filter=and((catalog.id)EQ('+catalogID+'))and((clip.modifiedDate)newer(172800))', // OFF -- extra 0 for testing
		  method: 'GET'
		};
		var request = http.request(options, function(res) {
		  var body = '';
		  res.setEncoding('utf8');
		  res.on('data', function (res) {
		  	body += res
		  });
		  res.on('end', function(){
		    var deferreds = [];
		  	var clipsData = JSON.parse(body).data.items
		  	for (index in clipsData) {
		  		deferreds.push(getClip(clipsData[index].ID));
			}

			when.all(deferreds).then(function () {
				callback();
			});
		  })
		  res.on('error', function(e) {
			  console.log('problem with request get Clips: ' + e.message);
		  });
		});
		request.end();
		request.on("error", function(e){
		    // ECONNRESET error is triggered here...
		    console.info(e);
		});
	}

	function getClip(clipID){
		var deferred = when.defer();
		var options = {
		  host: catdv_url,
		  port: catdv_port,
		  path: '/api/4/clips/'+clipID+';jsessionid='+jsessionid,
		  method: 'GET'
		};

		var request = http.request(options, function(res) {
		  var body = '';
		  res.setEncoding('utf8');
		  res.on('data', function (res) {
		  	body += res
		  });
		  res.on('end', function(){
		  	var clipData = JSON.parse(body).data
		  	if(clipData.userFields !== null && typeof clipData.userFields !== "undefined" ){
		  		var description = (typeof clipData.userFields.U1 !== "undefined" ?
		  		 clipData.userFields.U1.replace(/\n/g, "<br/>").replace(/\[pi\](.*?)\[\/pi\]/g, '<b>$1</b>').replace(/\[cc\](.*?)\[\/cc\]/g, '<i>$1</i>').replace(/\[.*?\]/g, '') : "No Script Found");
				feed.item({
				    title:  clipData.userFields.U5 + "-" + clipData.name,
				    description: description,
				    url: 'http://'+catdv_url+':'+catdv_port+'/catdv-web2/clip-details.jsp?id='+clipData.ID, // link to the item
				    author: clipData.userFields.U5, // optional - defaults to feed author property
				    date: clipData.modifiedDate, // any format that js Date can parse.
				});
			}
			else console.log('clip ' + clipData.ID + ": NO USER FIELDS!!! SKIPPED!!")
			deferred.resolve();
		  })
		  res.on('error', function(e) {
			  console.log('problem with request ' + clipData.ID + ': ' + e.message);
		  });
		});
		request.end();
		request.on("error", function(e){
		    // ECONNRESET error is triggered here...
		    console.info(e);
		});

		return deferred.promise
	}

	/* create an rss feed */
	var feed = new RSS({
	    title: 'E.W.Scripps Breaking News',
	    description: 'description',
	    feed_url: 'http://'+catdv_url+':8082/rss/BreakingNews',
	    site_url: 'http://'+catdv_url+':8082',
	    image_url: 'http://example.com/icon.png',
	    copyright: '2015 E.W. Scripps',
	    language: 'en',
	    ttl: '60',
	});

	getClipsFromCat(1727, 20, function(){
			var xml = feed.xml();
		    res.set('Content-Type', 'application/rss+xml');
		    res.send(xml);
		} );
	
	/*feed.item({
	    title:  'Test item id 38',
	    description: 'use this for the content. It can include html.',
	    url: 'http://216.21.175.195:8080/catdv-web2/clip-details.jsp?id='+38, // link to the item
	    // categories: ['Category 1','Category 2','Category 3','Category 4'], // optional - array of item categories
	    author: 'Guest Author', // optional - defaults to feed author property
	    date: 'May 27, 2012', // any format that js Date can parse.
	    lat: 33.417974, //optional latitude field for GeoRSS
	    long: -111.933231, //optional longitude field for GeoRSS
	    //enclosure: {url:'...', file:'path-to-file'}, // optional enclosure
	    // custom_elements: [
	    //   {'itunes:author': 'John Doe'},
	    //   {'itunes:subtitle': 'A short primer on table spices'},
	    //   {'itunes:image': {
	    //     _attr: {
	    //       href: 'http://example.com/podcasts/everything/AllAboutEverything/Episode1.jpg'
	    //     }
	    //   }},
	    //   {'itunes:duration': '7:04'}
	    // ]
	});*/

	// cache the xml to send to clients
}
exports.breakingNews = function(req, res) {

	getPubKey( function( key )
		{ 
			login_catdv(
				function()
				{
					generateRSS(res);
				}
			);
		}
	);
	
};

exports.index = function(req, res) {
  res.render('rssIndex', {
    title: 'RSS'
  });
	
};
