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
    $(":submit").show();
    $(".source-fields").fadeOut(300);
    if(sourceSelect.val() === "Satellite Downlink"){
      $("#downlink-fields").fadeIn(300);
    }
    else if(sourceSelect.val() === "The Bridge"){
      $("#file-upload").fadeIn(300);
      $(":submit").hide();
    }
    else{
      $("#downlink-fields").fadeOut(300);
    }
  });

  $("select#source-select").val("The Bridge").change();


  $("#dropZone").on( "dragenter", function(event){
    $("#dropArea").addClass("resumable-dragover");
    // console.log("drag enter");
  } );
  // $("#dropArea").on( "dragend", function(event){
  //   $("#dropArea").removeClass("resumable-dragover");
  // } );
  $("#dropZone").on( "dragleave", function(event){
    $("#dropArea").removeClass("resumable-dragover");
  } );
  // $("#dropArea").on( "drop", function(event){
  //   $("#curtain").removeClass("resumable-dragover");
  //   console.log("drag dropped");
  //   handleDrop(event);
  // } );

  // /* events fired on the drop targets */
  //  $("#dropArea").on("dragover", function( event ) {
  //     // prevent default to allow drop
  //     event.preventDefault();
  // });

});

function dragstart_handler(ev) {
 console.log("dragStart");
 // Add the target element's id to the data transfer object
 ev.dataTransfer.setData("text/plain", ev.target.id);
}

function handleDrop(e) {
  e.stopPropagation(); // Stops some browsers from redirecting.
  e.preventDefault();
  // console.debug(e);
  var dt = e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer);
  var files = e.target.files || (dt && dt.files);
  for (var i = 0, f; f = files[i]; i++) {
    // console.log(f);
    // Read the File objects in this FileList.
  }
}