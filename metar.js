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
    var ret = [];
    var remark_index = -1;

    var i;
    var parts; // as needed regex result parts (see wind)
    var tmp,key,res,remark_section;
    while(msplit.length) {
        res = { key: key=msplit.shift(), value: "unknown" };
        ret.push(res);

        if( key.match(/^\d+Z$/) ) { // time, do they *always* end in Z?  Who knows.  I hope so.
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
        }

        else if( parts = key.match(/^(VBR|[0-9]{3})([0-9]+)(?:G([0-9]+))?KT$/) ) {
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
        }

        else if( key.match(/^\d+SM$/) ) {
            res.visibility = my_parseint( msplit.splice(i,1)[0], "miles" );
        }

        else if( key.match(/^FEW\d+$/) ) {
            tmp = msplit.splice(i,1)[0].substr(3);
            tmp += "00";

            // res.cloud_cover.push({few: my_parseint(tmp, "feet")});
        }

        else if( key.match(/^BKN\d+$/) ) {
            tmp = msplit.splice(i,1)[0].substr(3);
            tmp += "00";

            // res.cloud_cover.push({broken: my_parseint(tmp, "feet")});
        }

        else if( parts = key.match(/^(\d+)\/(\d+)$/) ) {
            msplit.splice(i,1);

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
        }

        else if( remark_section ) {
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
