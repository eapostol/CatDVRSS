//NODE JS module for catdv rest api
module.exports = function(temporaryFolder){
  var CATDV_API_URL = "http://" + config.catdv_url + ":" + config.catdv_port + "/api";
  var functions = {
    getApiUrl : function(path)
    {
          var apiUrl = ((typeof(CATDV_API_URL) != "undefined") && (CATDV_API_URL != null)) ? CATDV_API_URL : "/api";
          return  apiUrl + "/4/" + path;
    },
    _catdv_api_get: function(path, data, success_callback, failure_callback)
    {
      var options = {
        host: 'www.random.org',
        path: '/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
      };

      callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
          str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
          console.log(str);
        });
      }

      http.request(options, callback).end();
      try
      {
        $.get(getApiUrl(path), $.extend(
        {
          __x : now()
        }, data), function(reply)
        {
          _handle_response(reply, success_callback, failure_callback);
        });
      }
      catch (e)
      {
        alert(e);
      }
    },
    _catdv_api_call: function(method, path, data, success_callback, failure_callback)
    {
      try
      {
        $.ajax(
        {
          type : method,
          url : $catdv.getApiUrl(path),
          contentType : "application/json; charset=UTF-8",
          data : JSON.stringify(data),
          success : function(reply)
          {
            _handle_response(reply, success_callback, failure_callback);
          }
        });
      }
      catch (e)
      {
        alert(e);
      }
    },


  }

  return functions;
}