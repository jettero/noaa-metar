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

// function my_error(text, calback) {{{
function my_error(text, callback) {
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
// }}}
// function get_metar(req, callback) {{{
function get_metar(req, callback) {
    req.worked = false;
    Mojo.Log.info("get_metar() checking for runing reqeusts: " + req.code);

    if( _REQ_DB[req.code] ) {
        try {
            Mojo.Log.info("get_metar() aborting running request");
            _REQ_DB[req.code].transport.abort();

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
                req.METAR  = extract_metar(req.code, transport.responseText);

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
// }}}
// function get_taf(req, callback) {{{
function get_taf(req, callback) {
    req.worked = false;
    Mojo.Log.info("get_taf() checking for runing reqeusts: " + req.code);

    if( _REQ_DB[req.code] ) {
        try {
            Mojo.Log.info("get_taf() aborting running request");
            _REQ_DB[req.code].transport.abort();

        } catch(e) {
            my_error("problem aborting previous request: " + e);
        }
    }

    Mojo.Log.info("get_taf() fetching: " + req.code);
    _REQ_DB[req.code] = new Ajax.Request('http://weather.noaa.gov/cgi-bin/mgettaf.pl', {
        method: 'get', parameters: { cccc: req.code },

        onSuccess: function(transport) {
            if( transport.status === 200 ) {
                req.worked = true;
                req.TAF  = extract_taf(req.code, transport.responseText);

                Mojo.Log.info("fetched fresh TAF(" + req.code + "): ", req.TAF);
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
// }}}

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
