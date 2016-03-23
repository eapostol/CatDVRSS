// Set this variable to the path within the web site where this file lives
var $catdv_SCRIPT_FILE_PATH = "/js/lib/catdv-api.js";

var catdv_login_handler = null;

$(document).ready(function()
{
	$(document).ajaxError(function(event, jqxhr, settings, exception)
	{
		if(jqxhr.status != 0)
		{
			// parse the Apache error response to extract the underlying Java exception message
			var msg = jqxhr.responseText
			var s = msg.lastIndexOf("<u>");
			var e = msg.lastIndexOf("</u>");
			if (e > s) msg = msg.substring(s + 3, e);
			alert("AJAX Error[" + jqxhr.status + "]:\n" + jqxhr.statusText + "\n" + msg);
		}
	});

});

function ClipQuery()
{
	this.terms = [];

	this.addAndTerm = function(field, op, value)
	{
		this.terms.push(
		{
			'field' : field,
			'op' : op,
			'value' : value,
			'orTerm' : false
		});
	};

	this.addOrTerm = function(field, op, value)
	{
		this.terms.push(
		{
			'field' : field,
			'op' : op,
			'value' : value,
			'orTerm' : true
		});
	};

	this.toString = function()
	{
		var query = "";

		for ( var i = 0; i < this.terms.length; i++)
		{
			query += (this.terms[i].orTerm ? "or" : "and");
			var val = this.terms[i].value.toString().replace("~", "~7E").replace("\(", "~28").replace("\)", "~29");
			query += "((" + this.terms[i].field + ")" + this.terms[i].op + "(" + val + "))";
		}
		return query;
	};
}

var $catdv =
{
	getApiUrl : function(path)
	{
        var apiUrl = ((typeof(CATDV_API_URL) != "undefined") && (CATDV_API_URL != null)) ? CATDV_API_URL : "/api";
        return  apiUrl + "/4/" + path;
	},
	registerLogInHandler : function(login_handler)
	{
		catdv_login_handler = login_handler;
	},

	getSessionKey : function(success_callback, failure_callback)
	{
		_catdv_api_get("session/key", {}, success_callback, failure_callback);
	},

	getSession : function(success_callback, failure_callback)
	{
		_catdv_api_get("session", {}, success_callback, failure_callback);
	},

	login : function(username, encryptedPassword, success_callback, failure_callback)
	{
		_catdv_api_get("session",
		{
			usr : username,
			epwd : encryptedPassword
		}, success_callback, failure_callback);
	},

	logout : function(success_callback, failure_callback)
	{
		_catdv_api_call('DELETE', "session", {}, success_callback, failure_callback);
	},

	getClips : function(query, success_callback, failure_callback)
	{
		_catdv_api_get("clips", query, success_callback, failure_callback);
	},

	getClip : function(clipId, success_callback, failure_callback)
	{
		_catdv_api_get("clips/" + clipId, {include : "proxyPath"}, success_callback, failure_callback);
	},
	
	updateClip : function(clip, success_callback, failure_callback)
	{
		_catdv_api_call('PUT', "clips/" + clip.ID, clip, success_callback, failure_callback);
	},
	
	addToBasket : function(clipIds, success_callback, failure_callback)
	{
		_catdv_api_call("POST", "basket", { clipIds : clipIds }, success_callback, failure_callback);
	},
	
	removeFromBasket : function(clipIds, success_callback, failure_callback)
	{
		_catdv_api_call("DELETE", "basket/[" + clipIds.join() + "]", {}, success_callback, failure_callback);
	},

	getBasketItems : function(success_callback, failure_callback)
	{
		_catdv_api_get("basket", {},  success_callback, failure_callback);
	},
	
	getNumBasketItems : function(success_callback, failure_callback)
	{
		_catdv_api_get("basket?count=true", {},  success_callback, failure_callback);
	},
	
	isItemInBasket: function(clipId, success_callback, failure_callback)
	{
		_catdv_api_get("basket?clipId=" + clipId + "&count=true", {},  function(count) { success_callback(count > 0); }, failure_callback);
	},

	getBasketActions : function(success_callback, failure_callback)
	{
		_catdv_api_get("basket/actions", {}, success_callback, failure_callback);
	},

	performBasketAction : function(actionId, success_callback, failure_callback)
	{
		_catdv_api_call("POST", "basket/actions/" + actionId, {}, success_callback, failure_callback);
	},
	
	initiateUpload : function(filename, fileSize, metadata, success_callback, failure_callback)
	{
		_catdv_api_call('POST', "uploads", { "filename" : filename, "fileSize": fileSize, "metadata" : metadata }, success_callback, failure_callback);
	}
};

function _catdv_api_get(path, data, success_callback, failure_callback)
{
	try
	{
		$.get($catdv.getApiUrl(path), $.extend(
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
}


function _catdv_api_call(method, path, data, success_callback, failure_callback)
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
}

function now()
{
	return new Date().getTime();
}

function _handle_response(reply, success_callback, failure_callback)
{
	if (reply.status == "OK")
	{
		success_callback(reply.data);
	}
	else if ((reply.status == "AUTH") && (catdv_login_handler != null))
	{
		catdv_login_handler(reply.status, reply.errorMessage, reply.data);
	}
	else
	{
		if (failure_callback)
		{
			failure_callback(reply.status, reply.errorMessage, reply.data);
		}
		else
		{
			alert(reply.errorMessage);
		}
	}
}