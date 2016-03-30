var config = require('../catdv_config');
var catdv_api = require('../libs/node-catdv');
var stations = require('../config/stations');
var feeds = require('../config/feeds');

exports.metrics = function(req, res) {
  // req.assert('id', 'ID cannot be blank').notEmpty();
  res.render('metrics', {
      title: 'Metrics', 
      API_URL: "http://"+config.catdv_url+":"+config.catdv_port+"/api",
      MASTERCAT_URL: "http://"+config.catdv_url+":"+config.catdv_port+"/catdv-web2/",
      username: config.catdv_user,
      password: config.catdv_pwd, 
      feeds: feeds,
      stations: stations
  });

}
