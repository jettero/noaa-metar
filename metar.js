/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/

// function my_parseint(ilike) {{{
function my_parseint(ilike, units) {
    ilike = ilike.replace(/[^0-9]/g, "").replace(/^0+/, ""); // STFU

    return [parseInt(ilike, 10), units];
}
// }}}

// function decode_metar(metar) {{{
function decode_metar(metar) {
    var msplit = metar.split(/\s+/);
    var res = [];
    var remark_index = -1;

    var i;
    var parts; // as needed regex result parts (see wind)
    var items_examined = 0;
    while(msplit.length && items_examined < msplit.length) {
        items_examined = 0;

        var alt;

        for(i=0; i<msplit.length; i++) {
            items_examined ++;

            if( msplit[i].match(/^\d+Z$/) ) { // time, do they *always* end in Z?  Who knows.  I hope so.
                var zulu = msplit.splice(i,1)[0];
                var d = zulu.substr(0,2);
                var H = zulu.substr(2,2);
                var M = zulu.substr(4,2);

                var date_ob = new Date();

                var m = date_ob.getUTCMonth();
                if( d < date_ob.getUTCDate() ) {
                    m ++; // if the zulu date is less than the current date, it's probably next month
                    if( m>12 )
                        m = 1; // also rollover to january
                }

                date_ob.setUTCDate(d);
                date_ob.setUTCMonth(m);
                date_ob.setUTCHours(H);
                date_ob.setUTCMinutes(M);

                res.date = date_ob.toLocaleString();

                break;
            }

            else if( parts = msplit[i].match(/^(VBR|[0-9]{3})([0-9]+)(?:G([0-9]+))?KT$/) ) {
                var wind = msplit.splice(i,1); // not really used, must be spliced

                var deg   = parts[1];
                var gusts = parts[3];

                res.wind = { speed: my_parseint( parts[2], "knots" ) };

                if( deg === "VBR" )
                    res.wind.variable = true;
                else
                    res.wind.direction = my_parseint( deg, "degrees" );

                if( gusts )
                    res.wind.gusts = my_parseint( gusts, "knots" );

                // 26016G22KT is 260deg 16knots and gusts to 22knots
                // VBR05KT is variable at 5knots
                break;
            }

            else if( msplit[i].match(/^\d+SM$/) ) {
                res.visibility = my_parseint( msplit.splice(i,1)[0], "miles" );

                break;
            }

            else if( msplit[i].match(/^FEW\d+$/) ) {
                alt = msplit.splice(i,1)[0].substr(3);
                alt += "00";

                res.cloud_cover.push({few: my_parseint(alt, "feet")});

                break;
            }

            else if( msplit[i].match(/^BKN\d+$/) ) {
                alt = msplit.splice(i,1)[0].substr(3);
                alt += "00";

                res.cloud_cover.push({broken: my_parseint(alt, "feet")});

                break;
            }

            else if( parts = msplit[i].match(/^(\d+)\/(\d+)$/) ) {
                msplit.splice(i,1);

                res.temperature = my_parseint( parts[1], "C" );
                res.dewpoint    = my_parseint( parts[2], "C" );
            }

            else if( msplit[i].match(/^OVC\d+$/) ) {
                alt = msplit.splice(i,1)[0].substr(3);
                alt += "00";

                res.cloud_cover.push({overcast: my_parseint(alt, "feet")});

                break;
            }

            else if( msplit[i].match(/^RMK$/) ) {
                var remark_tokens = msplit.splice(i);

                res.unknown_remark_tokens = remark_tokens;
                res.unknown_remark_tokens.shift(); // lose RMK

                break;
            }
        }
    }

    var rem = res.unknown_remark_tokens;

    if( rem ) {
        items_examined = 0;
        while( rem.length && items_examined < rem.length ) {
            items_examined = 0;

            for(i=0; i<rem.length; i++) {
                items_examined ++;

                if( rem[i].match(/^AO[12]$/) ) {
                    var automated = rem.splice(i,1)[0];

                    res.automated_weather_station = true;
                    res.precipiation_detector = automated.match(/2$/) ? true:false;

                    break;
                }
            }
        }
    }

    return res;
}
// }}}
// function extract_metar(airport, html) {{{
function extract_metar(airport, html) {
    html = html.replace(/<[^>]+>/g, ""); // STFU

    var metar = "? " + airport + " ?";

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
// }}}
