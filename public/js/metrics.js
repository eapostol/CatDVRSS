var $catdv = null; //does not handel CORS
var jsessionid = null;
var clips = [];
var filteredClips = [];

var catalogsUpload = {};
var catalogsDownload = {};

var stationsUpload = {};
var stationsDownload = {};
var secondsAgo = 1678000; //* 2;
// var secondsAgo = 2678000;


$( document ).ready(function() {
    $catdv = catdv.RestApi;
    CATDV_API_URL = $("input[name='api_url']").val();


          $("#categories-table").tablesorter();
          $("#stations-table").tablesorter();
          $("#clip-list").tablesorter();

    SignIn(function(){
      $catdv.getClips(
        {
          filter: "and((importSrc.importDate)newer("+secondsAgo+"))",
          include: "userFields,metadata"
        },  //path: '/api/4/clips;jsessionid='+jsessionid+'?filter=and((catalog.id)EQ('+catalogID+'))and((importSrc.importDate)newer('+feedInfo.newer+'))&include=userFields'
        function(data){
          // console.log(JSON.stringify(data));
          clips = data.items;
          calculateTOD(clips);
          calculateTODRecorded(clips);
          applyFilter();

          google.charts.load('current', {'packages':['corechart']});
          google.charts.setOnLoadCallback(drawChart);
        },
        function(error){
          console.log("error");
          console.log(error);
        }
      );

    });

    $('.slider-time-start').html(dt_from);
    $('.slider-time-end').html(dt_to);

    $('#filter').on('click', applyFilter);

    $("#slider-range").slider({
        range: true,
        min: min_val,
        max: max_val,
        step: 10,
        values: [min_val, max_val],
        slide: function (e, ui) {
            startDate = new Date(ui.values[0]*1000); //.format("yyyy-mm-dd hh:ii:ss");
            $('.slider-time-start').html(formatDT(startDate));

            endDate = new Date(ui.values[1]*1000); //.format("yyyy-mm-dd hh:ii:ss");                
            $('.slider-time-end').html(formatDT(endDate));
        }
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
            // console.log(username);
            // console.log(password);
            // console.log(reply.key);
            var encryptedPassword = encrypt(password, reply.key);
            // console.log(encryptedPassword);

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

function applyFilter(){
  filteredClips = filterClipsByDate(clips, startDate, endDate);
  populateDataList(filteredClips);
  populateCategoryUploadArray(filteredClips);
  populateCategoryDownloadArray(filteredClips);
  populateStationUploadArray(filteredClips);
  populateStationDownloadArray(filteredClips);
  calculateStationOwnedDownloads(filteredClips);
  calculateDownloadsPerUploadForStations(filteredClips);
  calculateNonDownloadsForStations(filteredClips);
  $("#categories-table").trigger("update");
  $("#stations-table").trigger("update");
  $("#clip-list").trigger("update");
}



function populateDataList(clips){
  var sortedCLips = clips.sort(function(a, b) {
    return (Object.byString(b, "userFields.U12") ) - (Object.byString(a, "userFields.U12") );
  })
  $("#clip-list").find("tr:gt(0)").remove();
  for(var i = 0 ; i < clips.length; i++){
    $("#clip-list tbody").append("<tr><td>"+clips[i].name+"</td><td>"+(Object.byString(clips[i], "userFields.U12") || 0)+"</td></tr>");
  }
}

//Fill catalogs upload array with clips in this catalog 
function populateCategoryUploadArray(clips){
  $(".category").each(function(index){
    var cTitle = this.id.split(":")[0]
    var cId = this.id.split(":")[1]
    // console.log("index "+ index + " is id " + this.id);
    catalogsUpload[cTitle] = findItemsWith(clips, "catalogID", cId );
    $(this).find(".ulcount").html(catalogsUpload[cTitle].length);
  })
}

//Calculate each clips downloads and sum them by category/catalog
function populateCategoryDownloadArray(clips){
  $(".category").each(function(index){
    var cTitle = this.id.split(":")[0]
    var cId = this.id.split(":")[1]
    // console.log("index "+ index + " is id " + this.id);
    $(this).find(".dlcount").html(countTotalDownloads(catalogsUpload[cTitle]));
  })
}

//Fill stations upload array with clips uploaded by each station 
function populateStationUploadArray(clips){
  $(".station").each(function(index){
    var sName = this.id.split(":")
    // console.log("index "+ index + " is id " + this.id);
    stationsUpload[sName] = findItemsWith(clips, "userFields.U5", sName );
    $(this).find(".ulcount").html(stationsUpload[sName].length);
  })
}

//Fill stations download array with clips downloaded by each station 
function populateStationDownloadArray(clips){
  $(".station").each(function(index){
    var sName = this.id.split(":")
    // console.log("index "+ index + " is id " + this.id);
    stationsDownload[sName] = findItemsWith(clips, "userFields.U13", sName );
    $(this).find(".dlcount").html(stationsDownload[sName].length);
  })
}
 
//Calculate each clips download count and sum them by station
function calculateStationOwnedDownloads(clips){
  $(".station").each(function(index){
    var sName = this.id
    // console.log("index "+ index + " is id " + this.id);
    $(this).find(".dl-owned-count").html(countTotalDownloads(stationsUpload[sName]));
  })
}

function calculateDownloadsPerUploadForStations(clips){
  $(".station").each(function(index){
    var sName = this.id
    // console.log( $(this).find(".dl-owned-count").text() );
    var dl = parseInt($(this).find(".dl-owned-count").text() ) || 0;
    var up = parseInt($(this).find(".ulcount").text() ) || 0;
    var ratio = (up == 0 ? 0 : (dl/up) ).toFixed(2);
    $(this).find(".ratio").html( ratio ) ;
    // $(this).find(".dl-owned-count").html(countTotalDownloads(stationsUpload[sName]));
  })
}

function calculateNonDownloadsForStations(clips){
  $(".station").each(function(index){
    var sName = this.id
    var nonDownloaded = findItemsWith(stationsUpload[sName], "userFields.U12", "", "equals" ) ;
    $(this).find(".non-dl-count").html(nonDownloaded.length);
  })
}


function countTotalDownloads(clips){
  var sum = 0;
  for(var i = 0 ; i < clips.length; i++){
    if(Object.byString(clips[i], "userFields.U12")){
      var num = parseInt(Object.byString(clips[i], "userFields.U12").toString()) || 0;
      sum += num;
    }
  }
  return sum;
}


function filterClipsByDate(clips, fromDate, toDate){
  var retArr = [];
  for(var i = 0 ; i < clips.length; i++){
    var clipDate = new Date(clips[i]["recordedDate"]) //recorded date is not always accurate (taken from video file)
    if( clipDate > fromDate && clipDate < toDate){ 
      retArr.push(clips[i])
    }
  }
  return retArr;
}

function findItemsWith(clips, field, value, operator){
  if(typeof operator == "undefined") operator = "contains"
  var retArr = [];
  for(var i = 0 ; i < clips.length; i++){
    var fieldValue = Object.byString(clips[i], field);
    var fieldString = null;
    if(fieldValue) fieldString = fieldValue.toString().toLowerCase();

    var searchTerm = null;
    if(value) searchTerm = value.toString().toLowerCase() || null;

    if (operator == "contains"){
      if(fieldString && fieldString.includes(searchTerm) ){
        retArr.push(clips[i])
      }
    } else if (operator == "equals"){
      if(fieldString == searchTerm ){
        retArr.push(clips[i])
      }
    } else {

    }
  }
  // console.log(retArr);
  return retArr;
}

function calculateTOD(clips){
  for(var i = 0 ; i < clips.length; i++){
    var clipDate = moment(Object.byString(clips[i], "userFields.U9"), "DD/MM/YYYY  h:mm:ssa").toDate();  
    // console.log(clipDate);
    clips[i].hourOfday = clipDate.getHours();

  }
  return clips
}

function calculateTODRecorded(clips){
  for(var i = 0 ; i < clips.length; i++){
    var clipDate = new Date(Object.byString(clips[i], "recordedDate")) ;  //recorded date is not always accurate (taken from video file)
    // console.log(clipDate);
    clips[i].hourOfdayRecorded = clipDate.getHours();

  }
  return clips
}


//Slider

var endDate = new Date();
var startDate = new Date( Math.abs(endDate - secondsAgo * 1000) ) ;
// startDate.setMonth( endDate.getMonth() - 1 );
var dt_from = formatDT(startDate );
var dt_to = formatDT(endDate);

var min_val = Date.parse(dt_from)/1000;
var max_val = Date.parse(dt_to)/1000;

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}
function formatDT(__dt) {
    var year = __dt.getFullYear();
    var month = zeroPad(__dt.getMonth()+1, 2);
    var date = zeroPad(__dt.getDate(), 2);
    var hours = zeroPad(__dt.getHours(), 2);
    var minutes = zeroPad(__dt.getMinutes(), 2);
    var seconds = zeroPad(__dt.getSeconds(), 2);
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
};

//chart


function drawChart() {
  dataArray = [
    ['Hour', 'imported', 'recorded']
  ];
  for(var i = 0; i < 24; i++){
    dataArray.push([ 
      i,
      findItemsWith(clips, "hourOfday", i.toString(), "equals" ).length,
      findItemsWith(clips, "hourOfdayRecorded", i.toString(), "equals" ).length,
      ]);
  }

  // console.log(JSON.stringify(dataArray) );
  var data = google.visualization.arrayToDataTable(dataArray);

  var options = {
    title: 'Uploads by the hour',
    curveType: 'function',
    legend: { position: 'bottom' },
    hAxis: { gridlines: { count: 24 } },
    bar: { groupWidth: '100%' }
  };

  var chart = new google.visualization.ColumnChart(document.getElementById('curve_chart'));

  chart.draw(data, options);
}

// http://10.50.3.150:8080/api/5/clips?filter=and((importSrc.importDate()newer(172000))%2526include%253DuserFields