//http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if( o == null){
            console.log("o is null");
            return;

        }
        if ( k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

Array.prototype.unique = function(a) {
    var seen = {};
    return this.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}

function createLine(x1,y1, x2,y2, value, name){
  var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
  var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  var transform = 'rotate('+angle+'deg)';
  $('#'+name).remove();
  var line = $('<div>')
    .appendTo('#stations-crosspoint')
    .addClass('line')
    .css({
      'position': 'absolute',
      'transform': transform
    })
    .width(length)
    .attr("id",name)
    .offset({left: x1, top: y1});

  // drawNumber((x1+x2)/2, (y1+y2)/2, value, name);
  drawNumber((length - 48) , 0, value, name);
  console.log(line);
  line.data("value", value);
  console.log(line.data("value"));
  return line;
}

function drawNumber(x, y, num, parent){
  $("#"+parent).empty();
  var number = $('<div>')
    .appendTo("#"+parent)
    .addClass('number-label')
    .css({
      'margin-left': x,
    })
    .html(num)
    // .offset({left: x, top: y});

  return number;
}