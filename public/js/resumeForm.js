var r = new Resumable({
    target:'/upload',
    chunkSize:1*1024*1024,
    simultaneousUploads:4,
    testChunks:false,
    throttleProgressCallbacks:1
  });
// Resumable.js isn't supported, fall back on a different method
      console.log("here Added");
if(!r.support) {
  $('.resumable-error').show();
  console.log("error");
} else {
  // Show a place for dropping/selecting files
  $('#dropArea').show();
  r.assignDrop($('#dropArea'));
  r.assignBrowse($('#browseFile'));

  // // Handle file add event
  r.on('fileAdded', function(file){
      console.log("file Added");
      // Show progress pabr
      $('#dropProgress').show();
      // Actually start the upload
      r.upload();
    });
  // r.on('pause', function(){
  //     // Show resume, hide pause
  //     $('.resumable-progress .progress-resume-link').show();
  //     $('.resumable-progress .progress-pause-link').hide();
  //   });
  r.on('complete', function(){

    });
  r.on('fileSuccess', function(file,message){

    });
  r.on('fileError', function(file, message){

    });
  r.on('fileProgress', function(file){
      // Handle progress for both the file and the overall upload
      $('#dropProgress').css({width:Math.floor(r.progress()*100) + '%'});
    });
  // r.on('cancel', function(){
  //   $('.resumable-file-progress').html('canceled');
  // });
  r.on('uploadStart', function(){
    console.log("upload start");
    $(":submit").prop('disabled', true);
    $("#submitMessage").show();
  });
}