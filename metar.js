function extract_metar(airport, html) {
    html = html.replace(/<[^>]+>/g, "");

    var metar = "? " + airport + " ?";

    Mojo.Log.info("extract_metar(): " + airport);

    var lines = html.split("\n");
    for(var i=0; i<lines.length; i++) {
        if( lines[i].substr(0, airport.length) == airport ) {
            if( lines[i].substr(airport.length).match(/\s[A-Z0-9\/:/-]+$/) ) {
                metar = lines[i];
                break;
            }
        }
    }

    Mojo.Log.info("extract_metar() got: " + metar);
    return metar;
}

function my_error(text, calback) {
    Mojo.Log.info("my_error(): " + text);

    Mojo.Controller.showAlertDialog({
        onChoose: function(value) {callback()},
        title: $L("Error"),
        message: $L(text),
        choices:[
             {label:$L("OK"), value:"OK", type:'dismiss'}    
        ]
    });
}

function get_metar(req, callback) {
    req.worked = false;
    Mojo.Log.info("get_metar() fetching: " + req.code);

    var cookie = new Mojo.Model.Cookie(req.code);
    var cached = cookie.get();

    if( cached && !req.force ) {
        req.worked = true;
        req.METAR  = cached;
        req.cached = true;

        Mojo.Log.info("fetched cached METAR("+req.code+"): ", cached);
        callback(req);

        return;
    }

    var d = new Date();
        d.setTime( d.getTime() + 3600000 ); // unix-milliseconds I guess

    var request = new Ajax.Request('http://weather.noaa.gov/cgi-bin/mgetmetar.pl', {
        method: 'get', parameters: { cccc: req.code }, 

        onSuccess: function(transport) {
            if( transport.status == 200 ) {
                req.worked = true;
                req.METAR  = extract_metar(req.code, transport.responseText);

                Mojo.Log.info("fetched fresh METAR("+req.code+"): ", req.METAR);
                cookie.put(req.METAR, d);
                callback(req);

            } else {
                my_error("Transport error: " + transport.statusText + " (" + transport.status + ")",
                    function() { callback(req); });
            }

        }.bind(this),

        onFailure: function(transport) {
            var t = new Template($L("Ajax Error: #{status}"));
            var m = t.evaluate(transport);
            var e = [m];

            Mojo.Controller.errorDialog(e.join("... "));
            my_error(e.join("... "), function() { callback(req); });

        }.bind(this)
    });
}
