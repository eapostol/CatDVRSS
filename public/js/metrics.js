var $catdv = null; //does not handel CORS
var jsessionid = null;
var clips = null;


$( document ).ready(function() {
    $catdv = catdv.RestApi;
    CATDV_API_URL = $("input[name='api_url']").val();
    SignIn(function(){
      $catdv.getClips(
        {
          filter: "and((importSrc.importDate)newer(2678000))",
          include: "userFields"
        },  //path: '/api/4/clips;jsessionid='+jsessionid+'?filter=and((catalog.id)EQ('+catalogID+'))and((importSrc.importDate)newer('+feedInfo.newer+'))&include=userFields'
        function(data){
          console.log(data);
          clips = data.items;
          populateDataList(clips);
        },
        function(error){
          console.log("error");
          console.log(error);
        }
      );

    });
});

function SignIn( callback )
{

  $catdv.getSessionKey(function(reply)
    {
        try
        {
            var username = $("input[name='txtUsername']").val();
            var password = $("input[name='txtPassword']").val();
            console.log(username);
            console.log(password);
            console.log(reply.key);
            var encryptedPassword = encrypt(password, reply.key);
            console.log(encryptedPassword);

            // $catdv.login(username, encryptedPassword, 
            $catdv.loginUnsecure(username, password, 
              function(response)
              {
                // $.cookie("username", username);
                jsessionid = response.jsessionid;
                console.log("logged in successfully");
                callback();
                  // var fwd = $.urlParam("fwd");
                  // window.location.replace(fwd ? fwd : "default.jsp");
              },
              function(status, errorMessage)
              {
                  alert("Login Failed: " + errorMessage);
              }
            );
        }
        catch (e)
        {
            alert(e);
        }
    });
}

function populateDataList(clips){
  for(var i = 0 ; i < clips.length; i++){
    $("#clip-list").append("<li>"+clips[i].name+"</li>");
  }
}

// http://10.50.3.150:8080/api/5/clips?filter=and((importSrc.importDate()newer(172000))%2526include%253DuserFields