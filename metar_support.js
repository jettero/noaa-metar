/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo Ajax extract_metar Template
*/

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
    Mojo.Log.info("get_metar() fetching: " + req.code);

    var request = new Ajax.Request('http://weather.noaa.gov/cgi-bin/mgetmetar.pl', {
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

        }.bind(this),

        onFailure: function(transport) {
            var t = new Template("Ajax Error: #{status}");
            var m = t.evaluate(transport);
            var e = [m];

            Mojo.Controller.errorDialog(e.join("... "));
            my_error(e.join("... "), function() { callback(req); });

        }.bind(this)
    });
}
// }}}
