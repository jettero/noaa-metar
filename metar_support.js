/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo Ajax extract_taf extract_metar Template setTimeout clearTimeout
*/

var _REQ_DB = {};

function abort_all() {
    for(var k in _REQ_DB) {
        try { _REQ_DB[k].transport.abort(); } catch(e) {}
        delete _REQ_DB[k];
    }
}

/* {{{ */ function extract_metar(airport, html) {

    /*
    <P>The observation is:</P>
    </font>

    <font face="courier" size = "5">

    </font>
    <hr>2011/02/21 20:53
    KAZO 212053Z 3/4SM -SN OVC010 A2985 RMK AO2 SLPNO 6//// 53006 $

    </FONT></TT></P>
    </td>
    */

    html = html.replace(/[\r\n\s]+/g, " ");

    Mojo.Log.info("Trying to find METAR in " + html.length + " bytes of HTML");

    var m;

    if( m = html.match(/The observation is:.+?<hr>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(.+?)<\/FONT>/) ) {
        Mojo.Log.info("Got something(1): " + m[1]);
        return m[1].replace(/[\r\n\s]+/, " ");
    }

    Mojo.Log.info("Not found so far, trying to find METAR using older techniques");

    html = html.replace(/<[^>]+>/g, ""); // STFU

    if( m = html.match(/(No METAR observation from .+? is available in our system.)/) ) {
        Mojo.Log.info("Found explicit DB miss: " + m[1]);
        return m[1];
    }

    var metar = "Unable to locate METAR for " + airport + " on NOAA webpage page.";

    var lines = html.split("\n");
    var potential;
    for(var i=0; i<lines.length; i++) {
        if( lines[i].substr(0, airport.length) === airport ) {

            // Everything but the airport code and the space
            potential = lines[i].substr(airport.length + 1);

            if( potential.match(/^[\sA-Z0-9\/:\/\-\$]+$/) ) {
                metar = potential;
                break;
            }
        }
    }

    return metar;
}

/*}}}*/
/* {{{ */ function extract_taf(airport, html) {
    html = html.replace(/[\r\n]/g, " ").replace(/ {2,}/g, " ");

    /*
    <P>The observation is:</P>
    </font>
    <font face="courier" size = "5">
    <pre>TAF
          AMD KAZO 211856Z 2119/2218 06012G22KT 3SM -SN BR OVC011
          TEMPO 2119/2123 3/4SM -SN BR OVC008
         FM220300 07010KT 4SM -SN BR OVC015
         FM221400 07010G18KT P6SM SCT035

    </pre>
    </font>
    */

    var taf = "Unable to locate TAF for " + airport + " on NOAA webpage page.";
    var m;

    if( m = html.match(/(No TAF from .+? is available in our system.)/) )
        return {TAF: m[1]};

    var amd = false;

    if( m = html.match( new RegExp("<pre>.*?(TAF\\s+(?:\\s*AMD\\s+)?" + airport + "\\s+.+?)</pre>") ) ) {

        taf = m[1].replace(/^TAF\s+/, "");

        if( taf.match(/^AMD\s+/) ) {
            taf = taf.replace(/^AMD\s+/, "");
            amd = true;
        }

        taf = taf.replace(new RegExp("^" + airport + "\\s+"), "");
    }

    return {TAF: taf, AMD: amd};
}

/*}}}*/

/* {{{ */ function my_error(text, callback) {
    Mojo.Log.info("my_error(): " + text);

    Mojo.Controller.showAlertDialog({
        onChoose: function(value) {callback();},
        title: "Error",
        message: text,
        choices:[
             {label: "OK", value: "OK", type: 'dismiss'}
        ]
    });
}

/*}}}*/
/* {{{ */ function get_metar(req, callback) {
    req.worked = false;
    Mojo.Log.info("get_metar() checking for runing reqeusts: " + req.code);

    if( _REQ_DB[req.code] ) {
        try {
            Mojo.Log.info("get_metar() aborting running request");
            _REQ_DB[req.code].transport.abort();
            delete _REQ_DB[req.code];

        } catch(e) {
            my_error("problem aborting previous request: " + e);
        }
    }

    Mojo.Log.info("get_metar() fetching: " + req.code);
    _REQ_DB[req.code] = new Ajax.Request('http://weather.noaa.gov/cgi-bin/mgetmetar.pl', {
        method: 'get', parameters: { cccc: req.code },

        onSuccess: function(transport) {
            if( transport.status === 200 ) {
                req.worked = true;

                try {
                    req.METAR  = extract_metar(req.code, transport.responseText);

                } catch(e) {
                    Mojo.Log.error("caught error during extract: " + e);
                }

                Mojo.Log.info("fetched fresh METAR(" + req.code + "): ", req.METAR);
                callback(req);

            } else {
                my_error("Transport error: " + transport.statusText + " (" + transport.status + ")",
                    function() { callback(req); });
            }

            _REQ_DB[req.code] = false;

        },

        onFailure: function(transport) {
            var t = new Template("Ajax Error: #{status}");
            var m = t.evaluate(transport);
            var e = [m];

            my_error(e.join("... "), function() { callback(req); });
            delete _REQ_DB[req.code];

        }
    });
}

/*}}}*/
/* {{{ */ function get_taf(req, callback) {
    req.worked = false;
    Mojo.Log.info("get_taf() checking for runing reqeusts: " + req.code);

    if( _REQ_DB[req.code] ) {
        try {
            Mojo.Log.info("get_taf() aborting running request");
            _REQ_DB[req.code].transport.abort();
            delete _REQ_DB[req.code];

        } catch(e) {
            my_error("problem aborting previous request: " + e);
        }
    }

    Mojo.Log.info("get_taf() fetching: " + req.code);
    _REQ_DB[req.code] = new Ajax.Request('http://weather.noaa.gov/cgi-bin/mgettaf.pl', {
        method: 'get', parameters: { cccc: req.code },

        onSuccess: function(transport) {
            if( transport.status === 200 ) {
                var tmp = extract_taf(req.code, transport.responseText);

                req.TAF    = tmp.TAF;
                req.preTAF = tmp.AMD ? "AMD" : "";
                req.worked = true;

                Mojo.Log.info("fetched fresh TAF(" + req.code + "): ", req.TAF);
                callback(req);

            } else {
                my_error("Transport error: " + transport.statusText + " (" + transport.status + ")",
                    function() { callback(req); });
            }

            delete _REQ_DB[req.code];

        },

        onFailure: function(transport) {
            var t = new Template("Ajax Error: #{status}");
            var m = t.evaluate(transport);
            var e = [m];

            my_error(e.join("... "), function() { callback(req); });
            delete _REQ_DB[req.code];

        }
    });
}

/*}}}*/

/* {{{ runtime setup */ (function(){
    var callInProgress = function(xmlhttp) {
        switch (xmlhttp.readyState) {
            case 1:
            case 2:
            case 3:
                return true;

            // Case 4 and 0
            default:
                return false;
        }
    };

    var now = function() {
        var d = new Date();
        var t = d.getTime();
        var n = Math.round( t/1000.0 );

        return n;
    };

    var ajaxTimeout = 10e3;

    Ajax.Responders.register({
        onCreate: function(request) {
            var f;

            request.before = now();
            request.timeoutId = setTimeout(
                f = function() {
                    if (callInProgress(request.transport)) {
                        Mojo.Log.info("AJAX-ext Timeout fired dt=%d", now() - request.before);
                        my_error("AJAX Request Timeout");
                        request.transport.abort();

                    } else {
                        Mojo.Log.info("AJAX-ext Timeout fired dt=%d — but no call was in progress", now() - request.before);
                    }
                },

                ajaxTimeout
            );
        },

        onComplete: function(request) {
            Mojo.Log.info("AJAX-ext Timeout cleared normally dt=%d", now() - request.before);
            clearTimeout(request.timeoutId);
        }
    });

}());

/*}}}*/
