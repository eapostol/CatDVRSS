Number.prototype.toUTCString = function () {
    var sign = this >= 0 ? "-" : "+";
    var min_num = Math.abs(this);
    var hours   = Math.floor(min_num / 60);
    var minutes = Math.floor((min_num - (hours * 60) ));

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    var time    = sign + hours+':'+minutes+" UTC";
    return time;
}
$(document).ready(function() {

  //set timezone form field
  $("input#time").val( moment().format("hh:mm a") );
  $("input#tz").val((new Date().getTimezoneOffset().toUTCString()));

  $("select#source-select").on("change", function(){
    var sourceSelect = $(this);
    if(sourceSelect.val() == "Satellite Downlink"){
      $("#downlink-fields").fadeIn(300);
    }
    else{
      $("#downlink-fields").fadeOut(300);
    }
  });

});