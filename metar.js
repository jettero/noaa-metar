/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/

/* {{{ */ function my_parseint(ilike, units, singular) {
    ilike = ilike.replace(/^M/, "-").replace(/[^0-9-]/g, "").replace(/^0+/, ""); // STFU

    if( ilike.length === 0 )
        ilike = "0";

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

/*}}}*/
/* {{{ */ function my_parsefloat(flike, units, singular) {
    flike = flike.replace(/^M/, "-").replace(/[^0-9.-]/g, "").replace(/^0+/, ""); // STFU

    var ret = [parseFloat(flike, 10), units];
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

/*}}}*/

/* {{{ */ function decode_metar(metar) {
    var msplit = metar.split(/\s+/);
    var ret = [];

    ret.toString = function() {
        var _tmp = [];

        for(var i=0; i<this.length; i++)
            _tmp.push( [this[i].key, this[i].txt].join(": ") );

        return _tmp.join("\n");
    };

    var i;
    var parts; // as needed regex result parts (see wind)
    var tmp,key,res,remark_section=false;
    while(msplit.length) {
        res = { key: key=msplit.shift(), txt: "<div class='unknown-decode'>unknown</div>" };
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
                if( res.wind.speed[0] === 0 ) {
                    res.txt = "little or no wind";

                } else {
                    res.txt = "wind speed is " + res.wind.speed;
                    if( deg === "VBR" ) {
                        res.wind.variable = true;
                        res.txt += ", direction variable";

                    } else {
                        res.wind.direction = my_parseint( deg, '&deg;' );
                        res.txt += " at " + res.wind.direction;
                    }

                    if( gusts ) {
                        res.wind.gusts = my_parseint( gusts, "knots" );
                        res.txt += " — gusting to " + res.wind.gusts;
                    }
                }
            }

            else if( key.match(/^\d+SM$/) ) {
                res.visibility = my_parseint( key, "statute miles" );
                res.txt = "visibility " + res.visibility;
            }

            else if( key === "SKC" ) {
                res.automated = false;
                res.clear_sky = true;
                res.txt = "blue skies";
            }

            else if( key === "CLR" ) {
                res.automated = true;
                res.clear_sky = true;
                res.txt = "blue skies (automated observation)";
            }

            else if( parts = key.match(/^(VV|FEW|SCT|BKN|OVC)(\d+)$/) ) {
                tmp = parts[2] || "";
                tmp += "00";

                res.layer_altitude = my_parseint( tmp, "feet" );
                res.layer_type = parts[1];

                res.txt = [{

                    VV:  "indefinite ceiling, vertical visibility to",
                    FEW: "few clouds at",
                    SCT: "scattered clouds at",
                    BKN: "broken clouds at",
                    OVC: "overcast at"

                }[res.layer_type], res.layer_altitude].join(" ");
            }

            else if( parts = key.match(/^(M?\d+)\/?(M?\d+)$/) ) {
                res.temperature = my_parseint( parts[1], "&deg;C" );
                res.dewpoint    = my_parseint( parts[2], "&deg;C" );

                res.txt = "temperature: " + res.temperature + ", dewpoint: " + res.dewpoint;
            }

            else if( parts = key.match(/^A(\d{2})(\d{2})$/) ) {
                parts.shift();
                res.altimeter_setting = my_parsefloat( parts.join("."), "inHg" );
                res.txt = "set altimeter to " + res.altimeter_setting;
            }

            else if( key === "AUTO" ) {
                res.fully_automated = true;
                res.txt = "fully automated report";
            }

            else if( key === "COR" ) {
                res.correction = true;
                res.txt = "corrected report";
            }

            else if( parts = key.match(/^(-|\+|VC)?(TS|SH)((RA|SN|PE|GS|GR)*)$/) ) {
                // NOTE The TS and SH descriptors are not well behaved.  TS in
                // particular isn't sure if it's colmun 2 or 3.  TS gets 0 or
                // more precipitation types, SH gets 1 more more, forgive the
                // use of *

                res.intensity  = parts[1]; // intensity or proximity (1)
                res.descriptor = parts[2]; // descriptor (2)
                res.phenomena  = parts[3].match(/(..)/g) || []; // precipitation type (3)

                var precip = { DZ: "drizzle", RA: "rain", SN: "snow", SG: "snow grains",
                    IC: "ice crystals", PE: "ice pellets", GR: "hail", GS: "small hail (or snow pellets)" };

                res.phenomena.toString = function() {
                    if( this.length === 1 )
                        return precip[this[0]];

                    var m = this.length-2;
                    var r = "";

                    for(var i=0; i<m; i++)
                        r += precip[this[i]] + ', ';

                    return r + precip[this[m]] + " and " + precip[this[m + 1]];
                };

                if( res.descriptor === "TS" ) {
                    res.txt = res.phenomena.length ? "thunderstorm with " + res.phenomena : "thunderstorm";

                } else {
                    res.txt = res.phenomena.length === 1
                            ? res.phenomena + " showers" : "showers of " + res.phenomena;
                }

                if( res.intensity ) {
                    if( res.intensity === "VC" )
                        res.txt += " in the vicinity";

                    else res.txt = (res.intensity === "+" ? "heavy " : "light ") + res.txt;
                }
            }

            else if( parts = key.match(/^(-|\+|VC)?(MI|PR|BC|DR|BL|TS|FZ)?(DZ|RA|SN|SG|IC|PE|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/) ) {
                // NOTE: the html FMH-1 shows SS for duststorm, but they clearly mean DS
                res.intensity  = parts[1]; // intensity or proximity (1)
                res.descriptor = parts[2]; // descriptor (2)
                res.phenomenon = parts[3]; // precipitation (3), obscuration (4), or other (5)

                res.txt = {
                    // precipitation (3)
                    DZ: "drizzle", RA: "rain", SN: "snow", SG: "snow grains", IC: "ice crystals", PE: "ice pellets",
                    GR: "hail", GS: "small hail and/or snow pellets", UP: "unknown precipitation",

                    // obscuration (4)
                    BR: "mist", FG: "fog", FU: "smoke", VA: "volcanic ash", DU: "widespread dust", SA: "sand",
                    HZ: "haze", PY: "spray",

                    // other (5)
                    PO: "well-developed dust/sand whirls", SQ: "squalls",
                    FC: "funnel cloud", SS: "sandstorm", DS: "duststorm"

                }[res.phenomenon];

                if( res.descriptor ) {
                    res.txt = {
                        MI: "shallow", PR: "partial", BC: "patches of", DR: "low drifting", BL: "blowing", FZ: "freezing"

                    }[res.descriptor] + " " + res.txt;
                }

                if( res.intensity ) {
                    if( res.intensity === "VC" ) {
                        res.txt += " in the vicinity";

                    } else {
                        if( res.phenomenon === "FC" && res.intensity === "+" )
                            res.txt = "tornado or waterspout";

                        else
                            res.txt = (res.intensity === "+" ? "heavy " : "light ") + res.txt;
                    }
                }
            }

            else if( key === "RMK" ) {
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

            } else {
                res._other_remark = true;
            }
        }
    }

    var other_remarks = [];
    for(i=ret.length-1; i>=0; i--)
        if( ret[i]._other_remark )
            other_remarks.push( ret.splice(i,1)[0].key );

    ret.push({ key: "other", txt: other_remarks.join(" ") });

    return ret;
}

/*}}}*/
/* {{{ */ function extract_metar(airport, html) {
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

/*}}}*/
