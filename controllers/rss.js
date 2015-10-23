/**
 * GET /rss/BreakingNews
 * Breaking News rss feed.
 */

var RSS = require('rss');
var http = require('http');
var when = require('when');
var config = require('../catdv_config');
var mongoose = require('mongoose');
var validUrl = require('valid-url');

var expressValidator = require('express-validator');

var feeds = [
	{title: "BreakingNews", catID: 1727, display: "Breaking News" },
	{title: "Shared", catID: 1234, display: "Shared" },
	{title: "Enterprise", catID: 1234, display: "Enterprise" },
	{title: "TheNow", catID: 3802, display: "The Now" }
]


//define the schema
var feedItemSchema = new mongoose.Schema({
  feed: { type: String, default: 'Breaking News' },
  title: String,
  summary: String,
  link: String,
  created_at: Date,
  expires_at: Date //hours

});
//define the model based on the schema
var Item = mongoose.model('Item', feedItemSchema);

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

function generateRSS(feedInfo, res){
	//onsole.log(feedInfo.display);


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
		  	// console.log("ID= " )
		  	if(clipData.userFields !== null && typeof clipData.userFields !== "undefined" ){
		  		var description = (typeof clipData.userFields.U1 !== "undefined" ?
		  		 clipData.userFields.U1.replace(/\n/g, "<br/>").replace(/\[pi\](.*?)\[\/pi\]/g, '<b>$1</b>').replace(/\[cc\](.*?)\[\/cc\]/g, '<i>$1</i>').replace(/\[.*?\]/g, '') : "No Script Found");
				feed.item({
				    title:  clipData.userFields.U5 + " " + (typeof clipData.userFields.U6 !== "undefined" && clipData.userFields.U6 !== "" ? clipData.userFields.U6 : clipData.name),
				    description: description,
				    url: 'http://'+catdv_url+':'+catdv_port+'/catdv-web2/clip-details.jsp?id='+clipData.ID, // link to the item
				    author: clipData.userFields.U5, // optional - defaults to feed author property
				    date: (typeof clipData.userFields.modifiedDate !== "undefined" ? clipData.modifiedDate : null), // any format that js Date can parse.
				    guid: (typeof clipData.ID !== "undefined" ? clipData.ID : null)
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

	function getAddedItems(name, callback){
		//console.log(name);
		Item.find({feed: name})
		.where('expires_at').gt(Date.now())
		.exec(function(err, items){
			if(err) console.error(err);
			else{
				for (var i = 0; i < items.length; i++ ){
					var url = items[i].link;
				    if (!validUrl.isUri(url)){
			        url = "http://"+config.this_host+":"+config.this_port+"/rss/" +items[i].id;
				    }

					//console.log(items[i].title);
					feed.item({
					    title:  items[i].title,
					    description:  items[i].summary,
					    url:  url, //(typeof items[i].link !== "undefined" ? items[i].link : "/"), // link to the item
					    author: "Self",
					    date: items[i].created_at, // any format that js Date can parse.
					    guid: (typeof items[i].guid !== "undefined" ? items[i].guid : items[i].created_at.toFormat("YYMMDDHHMISSPP"))
					});
				}
			}
			callback();
		});
	}
	/* create an rss feed */
	var feed = new RSS({
	    title: 'E.W.Scripps ' + feedInfo.display,
	    description: 'description',
	    feed_url: 'http://'+catdv_url+':8082/rss/feed?rss='+feedInfo.title,
	    site_url: 'http://'+catdv_url+':8082',
	    //image_url: 'http://example.com/icon.png',
	    copyright: '2015 E.W. Scripps',
	    language: 'en',
	    ttl: '60',
	});

	getClipsFromCat(feedInfo.catID, 20, function(){
			getAddedItems(feedInfo.display, function(){
				var xml = feed.xml();
			    res.set('Content-Type', 'application/rss+xml');
			    res.send(xml);
			});
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

function findFeedByName(name){
	for(var i = 0 ; i < feeds.length; i++){
		//console.log(feeds[i].title + " vs " + name);
		if(feeds[i].title === name) return feeds[i];
	}
	return null;
}

exports.getRSS  = function(req, res) {

	var feed = findFeedByName(req.query.rss)
	getPubKey( function( key )
		{ 
			login_catdv(
				function()
				{
					if(feed != null) generateRSS(feed, res);
					else {
						var msg = [{error: "Feed not found: " + req.query.rss}];
					    res.set('Content-Type', 'application/json');
					    res.send(msg);
					}
				}, 
				function(){
					var msg = [{error: "Login_failed"}];
				    res.set('Content-Type', 'application/json');
				    res.send(msg);
				}
			);
		}
	);
	
};


exports.getItem  = function(req, res) {

	Item.findOne({_id : req.params.id}, function(err, item){
		if(err) return console.error(err);
		//console.log(items);
		res.render('rss/show', {
		    title: 'RSS', item: item
		});
	});
	console.log(req.params.id)
	// console.log(findFeedByName(req.query.rss))
	// var feed = findFeedByName(req.query.rss)
	// getPubKey( function( key )
	// 	{ 
	// 		login_catdv(
	// 			function()
	// 			{
	// 				if(feed != null) generateRSS(feed, res);
	// 				else {
	// 					var msg = [{error: "Feed not found: " + req.query.rss}];
	// 				    res.set('Content-Type', 'application/json');
	// 				    res.send(msg);
	// 				}
	// 			}, 
	// 			function(){
	// 				var msg = [{error: "Login_failed"}];
	// 			    res.set('Content-Type', 'application/json');
	// 			    res.send(msg);
	// 			}
	// 		);
	// 	}
	// );
	
};

exports.index = function(req, res) {
	Item.find({}).sort({"created_at": "descending"}).exec(
		function(err, items){
		if(err) return console.error(err);
		//console.log(items);
		res.render('rss/index', {
		    title: 'RSS', items: items, feeds: feeds
		});
	});
	
};


exports.createItem = function(req, res) {
  res.render('rss/new', {
    title: 'RSS - New Item', feeds: feeds
  });
	
};


/**
 * POST /rss/newItem
 * create a new RSS item.
 */
exports.postItem = function(req, res) {
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('station', 'Station cannot be blank').notEmpty();
  req.assert('summary', 'Summary cannot be blank').notEmpty();
  req.assert('feed', 'Feed cannot be blank').notEmpty();
  req.assert('expires', 'Experation must be an integer in days').isInt();
  
  //req.assert('link', 'Message cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/rss/newItem');
  }
  console.log("Link: " + req.body.link)

  var thisItem = new Item({ 
  	feed: req.body.feed,
  	title: expressValidator.escape(req.body.station) + " " + expressValidator.escape(req.body.title),
  	summary: expressValidator.escape(req.body.summary),
  	link: req.body.link,
  	created_at: Date.now(),
  	expires_at: new Date(Date.now()).addDays(parseInt(req.body.expires)).getTime()
  });

  thisItem.save(function (err, thisItem) {
	  if (err){
    	req.flash('errors', errors);
    	return res.redirect('/rss/newItem');
	  }
	  return res.redirect('/rss/');
  });

  var title = req.body.title;
  var summary = req.body.summary;
  var feed = req.body.feed;
  
};


exports.deleteItem = function(req, res) {
  req.assert('id', 'ID cannot be blank').notEmpty();
  Item.find({ _id:req.body.id }).remove(function(err){
  	console.log("Delete: " + req.body.id)
  	res.redirect('/rss');
  })

}
