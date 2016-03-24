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