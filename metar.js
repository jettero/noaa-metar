function extract_metar(airport, html) {
    html = html.replace(/<[^>]+>/g, "");

    var metar = "?";

    var lines = html.split("\n");
    for(var i=0; i<lines.length; i++) {
        if( lines[i].substr(0, airport.length) == airport ) {
            if( lines[i].substr(airport.length).match(/\s[A-Z0-9\/:/-]+$/) ) {
                metar = lines[i];
                break;
            }
        }
    }

    return metar;
}

function get_metar(code, callback) {
    callback(code, code + " blarg blarg blarg");
}
