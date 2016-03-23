var config = require('../catdv_config');
var catdv_api = require('../libs/node-catdv');

exports.metrics = function(req, res) {
  // req.assert('id', 'ID cannot be blank').notEmpty();
  res.render('metrics', {
      title: 'Metrics', username: config.catdv_user, password: config.catdv_pwd, API_URL: "http://"+config.catdv_url+":"+config.catdv_port+"/api"
  });

}
