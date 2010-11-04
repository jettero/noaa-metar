/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/

// function my_parseint(ilike) {{{
function my_parseint(ilike, units, singular) {
    ilike = ilike.replace(/[^0-9]/g, "").replace(/^0+/, ""); // STFU

    var ret = [parseInt(ilike, 10), units];
    ret.toString = function() {
        if( ret[0] === 1 ) {
            if( singular )
                return [ret[0], singular].join(" ");
            return [ret[0], units.replace(/s$/, "")].join(" ");
        }
        return ret.join(" ");
    };

    return ret;
}
// }}}

// function decode_metar(metar) {{{
function decode_metar(metar) {
    var msplit = metar.split(/\s+/);
    var ret = [];

    var i;
    var parts; // as needed regex result parts (see wind)
    var tmp,key,res,remark_section=false;
    while(msplit.length) {
        res = { key: key=msplit.shift(), txt: "unknown" };
        ret.push(res);

        if( !remark_section ) {
            if( key.match(/^\d+Z$/) ) { // time, do they *always* end in Z?  Who knows.  I hope so.
                var d = key.substr(0,2);
                var H = key.substr(2,2);
                var M = key.substr(4,2);

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

                res.date_ob = date_ob;
                res.txt = date_ob.toLocaleString();
            }

            else if( parts = key.match(/^(VBR|[0-9]{3})([0-9]+)(?:G([0-9]+))?KT$/) ) {
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
            }

            else if( key.match(/^\d+SM$/) ) {
                res.visibility = my_parseint( msplit.splice(i,1)[0], "miles" );
            }

            else if( key.match(/^FEW\d+$/) ) {
                tmp = key.substr(3);
                tmp += "00";

                // res.cloud_cover.push({few: my_parseint(tmp, "feet")});
            }

            else if( key.match(/^BKN\d+$/) ) {
                tmp = key.substr(3);
                tmp += "00";

                // res.cloud_cover.push({broken: my_parseint(tmp, "feet")});
            }

            else if( parts = key.match(/^(\d+)\/(\d+)$/) ) {
                res.temperature = my_parseint( parts[1], "C" );
                res.dewpoint    = my_parseint( parts[2], "C" );
            }

            else if( key.match(/^OVC\d+$/) ) {
                tmp = msplit.splice(i,1)[0].substr(3);
                tmp += "00";

                // res.cloud_cover.push({overcast: my_parseint(tmp, "feet")});
            }

            else if( key.match(/^RMK$/) ) {
                remark_section = true;
                res.txt = "(remarks follow)";
            }

        } else {
            if( key.match(/^AO[12]$/) ) {
                res.txt = "automated weather station";
                res.automated_weather_station = true;

                if( key.match(/2$/) ) {
                    res.txt += " with precipitation detector";
                    res.precipiation_detector = true;
                }
            }
        }
    }

    return ret;
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
