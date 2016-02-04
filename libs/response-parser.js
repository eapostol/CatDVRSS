
var js2xmlparser = require("js2xmlparser");

exports.buildSummary = function( body ){
  var alltext = "<br/>\r\n";
  alltext += "[Description:] " + body.description + "<br/>\r\n";
  alltext += "[Source:] " + body.source + "<br/>\r\n";
  if(body.source == "Satellite Downlink"){
    alltext += "-[Satellite:] " + body.satellite + "<br/>\r\n";
    alltext += "-[Channel:] " + body.channel + "<br/>\r\n";
    alltext += "-[Polarity:] " + body.polarity + "<br/>\r\n";
    alltext += "-[FEC:] " + body.fec + "<br/>\r\n";
    alltext += "-[Symbol Rate:] " + body.symbol + "<br/>\r\n";
    alltext += "-[Data Rate:] " + body.datarate + "<br/>\r\n";
    alltext += "-[Window Times:] " + body.window + "<br/>\r\n";
    alltext += "-[Troubleshooting Number:] " + body.troubleNumber + "<br/>\r\n";
  }
  alltext += "[Reporter:] " + body.reporter + "<br/>\r\n";
  alltext += "[Location:] " + body.location + "<br/>\r\n";
  alltext += "[Time:] " + body.time + "<br/>\r\n";
  alltext += "[Timezone:] "+ body.tz + "<br/>\r\n";
  alltext += "[Format:] " + body.format + "<br/>\r\n";
  alltext += "[TRT:] " + body.trt + "<br/>\r\n";
  alltext += "[Embargo:] " + body.embargo + "<br/>\r\n";
  return alltext;
}

exports.buildXML = function(data){
  var outData = { 
      CLIP: {
        mediapath: "./"+data.filename,
        USER1: data.summary,
        USER2: null,  // aeset
        USER3: data.embargo,
        USER4: null, // video notes
        USER5: data.station,
        USER6: data.title,
        USER7: data.summary, //html notes
        USER8: null, // related slugs
        USER9: null, 
        USER10: null, //publish or deliver to
        NOTES: "bin="+data.feed 
      }
  };
  var outXML = js2xmlparser("CLIPS", outData);
  return outXML;
  console.log(outXML);
}
