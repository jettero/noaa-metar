/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/

/* {{{ */ var PDB = { // Phenomena text DataBase

    // descriptor (2)
    MI: "shallow", PR: "partial", BC: "patches of", DR: "low drifting", BL: "blowing", FZ: "freezing",

    // precipitation (3)
    DZ: "drizzle", RA: "rain", SN: "snow", SG: "snow grains", IC: "ice crystals", PE: "ice pellets",
    GR: "hail", GS: "small hail and/or snow pellets", UP: "unknown precipitation",

    // obscuration (4)
    BR: "mist", FG: "fog", FU: "smoke", VA: "volcanic ash", DU: "widespread dust", SA: "sand",
    HZ: "haze", PY: "spray",

    // other (5)
    PO: "well-developed dust/sand whirls", SQ: "squalls",
    FC: "funnel cloud", SS: "sandstorm", DS: "duststorm"
};

/*}}}*/

/* {{{ */ function my_parseint(ilike, units, singular, sep) {
    ilike = ilike.replace(/^M/, "-").replace(/[^0-9-]/g, "").replace(/^0+/, ""); // STFU

    if( ilike.length === 0 )
        ilike = "0";

    if( !sep )
        sep = " ";

    var ret = [parseInt(ilike, 10), units];
    ret.toString = function() {
        if( ret[0] === 1 ) {
            if( singular )
                return [ret[0], singular].join(sep);

            return [ret[0], units.replace(/s$/, "")].join(sep);
        }
        return ret.join(sep);
    };

    return ret;
}

/*}}}*/
/* {{{ */ function my_parsefloat(flike, units, singular, sep) {
    flike = flike.replace(/^M/, "-").replace(/[^0-9.-]/g, "").replace(/^0+/, ""); // STFU

    if( flike.length === 0 )
        flike = "0";

    if( flike === "." )
        flike = "0";

    if( !sep )
        sep = " ";

    var ret = [parseFloat(flike, 10), units];
    ret.toString = function() {
        if( ret[0] === 1 ) {
            if( singular )
                return [ret[0], singular].join(sep);

            return [ret[0], units.replace(/s$/, "")].join(sep);
        }
        return ret.join(sep);
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

    var date_ob;

    var i;
    var parts; // as needed regex result parts (see wind)
    var tmp,tmp2,tmp3,key,next_key,last_key,res,remark_section=false,_lookahead_skip;
    while(msplit.length) {
        _lookahead_skip = false;

        last_key = key || "";

        res = { key: key=msplit.shift(), txt: "<div class='unknown-decode'>unknown</div>" };

        next_key = msplit.length ? msplit[0] : "";

        if( !remark_section ) {
            if( key.match(/^\d+Z$/) ) { // time, do they *always* end in Z?  Who knows.  I hope so.
                tmp = {
                    d: key.substr(0,2),
                    H: key.substr(2,2),
                    M: key.substr(4,2)
                };

                date_ob = new Date();

                tmp.m = date_ob.getUTCMonth();
                if( tmp.d < date_ob.getUTCDate() ) {
                    tmp.m ++; // if the zulu date is less than the current date, it's probably next month
                    if( tmp.m>12 )
                        tmp.m = 1; // also rollover to january
                }

                date_ob.setUTCDate(tmp.d);
                date_ob.setUTCMonth(tmp.m);
                date_ob.setUTCHours(tmp.H);
                date_ob.setUTCMinutes(tmp.M);

                res.date_ob = date_ob;
                res.txt = date_ob.toLocaleString().replace(/\b(\d{1,2}:\d{2}):\d{2}/, "$1");
            }

            else if( parts = key.match(/^(VBR|[0-9]{3})([0-9]+)(?:G([0-9]+))?KT$/) ) {
                tmp = {
                    deg:   parts[1],
                    gusts: parts[3]
                };

                res.wind = { speed: my_parseint( parts[2], "knots" ) };
                if( res.wind.speed[0] === 0 ) {
                    res.txt = "little or no wind";

                } else {
                    res.txt = "wind speed is " + res.wind.speed;
                    if( tmp.deg === "VBR" ) {
                        res.wind.variable = true;
                        res.txt += ", direction variable";

                    } else {
                        res.wind.direction = my_parseint( tmp.deg, '&deg;', '&deg;', '' );
                        res.txt += " at " + res.wind.direction;
                    }

                    if( tmp.gusts ) {
                        res.wind.gusts = my_parseint( tmp.gusts, "knots" );
                        res.txt += " — gusting to " + res.wind.gusts;
                    }
                }
            }

            else if( key.match(/^M?\d+$/) && next_key.match(/\d+SM$/) ) {
                msplit[0] = [key, msplit[0]].join(" ");
                _lookahead_skip = true;
            }

            else if( parts = key.match(/^(M)?((\d+) )?((\d+)\/)?(\d+)SM$/) ) {
                // js> "M1 1/2SM".match(/^(M)?((\d+) )?((\d+)\/)?(\d+)SM$/)
                // M1 1/2SM,M,1 ,1,1/,1,2
                // 0        1 2  3 4  5 6

                tmp = parts[6];
                if( parts[5] )
                    tmp = parseInt(parts[5],10) / parseInt(tmp,10);

                if( parts[3] )
                    tmp += parseInt(parts[3],10); // we assume "1 1/4" occurs, but "1 1" does not

                res.visibility = my_parsefloat( tmp+"", "statute miles" );
                res.less_than  = parts[1] ? true : false;
                res.txt = "visibility " + (res.less_than ? "less than " : "") + res.visibility;
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
                res.temperature = my_parseint( parts[1], "&deg;C", "&deg;C", "");
                res.dewpoint    = my_parseint( parts[2], "&deg;C", "&deg;C", "");

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

                res.phenomena.toString = function() {
                    if( this.length === 1 )
                        return PDB[this[0]];

                    var m = this.length-2;
                    var r = "";

                    for(var i=0; i<m; i++)
                        r += PDB[this[i]] + ', ';

                    return r + PDB[this[m]] + " and " + PDB[this[m + 1]];
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

                res.txt = PDB[res.phenomenon];

                if( res.descriptor )
                    res.txt = PDB[res.descriptor] + " " + res.txt;

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
            res.txt = "<div class='unknown-decode'>partially detected, parse failed</div>";

            if( key.match(/^AO[12]$/) ) {
                res.txt = "automated weather station";
                res.automated_weather_station = true;

                if( key.match(/2$/) ) {
                    res.txt += " with precipitation detector";
                    res.precipiation_detector = true;
                }

            } else if( parts = key.match(/^SLPNO$/) ) {
                res.txt = "sea level pressure unavailable";

            } else if( parts = key.match(/^SLP(\d+)(\d)$/) ) {
                tmp = [ parts[1], parts[2] ].join(".");
                res.sea_level_pressure = my_parsefloat(tmp.match(/^[6789]/) ? '9'+tmp : '10'+tmp, 'hPa');
                res.txt = "sea level pressure is " + res.sea_level_pressure;

            } else if( parts = key.match(/^1(0|1)(\d{3})$/) ) {
                res.sixh_maximum_temperature = my_parseint( parts[1]==="1" ? "-" + parts[2] : parts[2], "&deg;C", "&deg;C", "" );
                res.txt = "6 hour maximum temperature is " + res.sixh_maximum_temperature;

            } else if( parts = key.match(/^2(0|1)(\d{3})$/) ) {
                res.sixh_minimum_temperature = my_parseint( parts[1]==="1" ? "-" + parts[2] : parts[2], "&deg;C", "&deg;C", "" );
                res.txt = "6 hour minimum temperature is " + res.sixh_minimum_temperature;

            } else if( parts = key.match(/^T(\d)(\d{2})(\d)(\d)(\d{2})(\d)$/) ) {
                tmp = [parts[2], parts[3]].join(".");
                tmp = parts[1]==="1" ? '-' + tmp : tmp;
                res.hourly_temperature = my_parsefloat( tmp, '&deg;C', '&deg;C', '' );

                tmp = [parts[5], parts[6]].join(".");
                tmp = parts[4]==="1" ? '-' + tmp : tmp;
                res.hourly_dewpoint = my_parsefloat( tmp, '&deg;C', '&deg;C', '' );

                res.txt = "hourly temperature is " + res.hourly_temperature
                        + ", hourly dewpoint is "  + res.hourly_dewpoint;

            } else if( parts = key.match(/^P(\d{2}\d{2})$/) ) {
                res.precipitation = my_parsefloat( [parts[1],parts[2]].join("."), "inches" );
                res.txt = res.precipitation[0]===0
                        ? "no hourly precipitation" : "hourly precipitation is " + res.precipitation;

            } else if( key.match(/^((MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PE|GR|GS)+(B\d{2,4}|E\d{2,4})+)+$/) ) {
                // NOTE: this is evil ... TSB0159E30, SHRAB05E30SHSNB20E55, RAB05E30SNB20E55, etc ... are all legal
                tmp = key.match(/(MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PE|GR|GS)+(B\d{2,4}|E\d{2,4})+/g);
                tmp2 = [];

                res.phenomena_begin_end = [];

                for(i=0; i<tmp.length; i++) {
                    parts = tmp[i].match(/((MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PE|GR|GS)+)(B(\d{2})(\d{2})?)?(E(\d{2})(\d{2})?)?/);
                    //js> "SHRAB0107E07".match(/((MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PE|GR|GS)+)(B(\d{2})(\d{2})?)?(E(\d{2})(\d{2})?)?/);
                    //SHRAB0107E07,SHRA,RA,B0107,01 ,07,E07,  07,
                    //SHRAB07E0107,SHRA,RA,B07  ,07 ,  ,E0107,01,07
                    //SHRAE03,     SHRA,RA,     ,   ,  ,E03,  03,
                    // 0           1    2  3     4   5  6     7  8

                    res.phenomena_begin_end.push(tmp3 = { phenomena: decode_metar(parts[1]) });

                    if( parts[3] ) {
                        tmp3.begin = new Date(date_ob);

                        if( parts[5] ) {
                            tmp3.begin.setUTCHours(  parts[4]);
                            tmp3.begin.setUTCMinutes(parts[5]);

                        } else {
                            tmp3.begin.setUTCMinutes(parts[4]);
                        }
                    }

                    if( parts[6] ) {
                        tmp3.end = new Date(date_ob);

                        if( parts[8] ) {
                            tmp3.end.setUTCHours(  parts[7]);
                            tmp3.end.setUTCMinutes(parts[8]);

                        } else {
                            tmp3.end.setUTCMinutes(parts[7]);
                        }
                    }

                    tmp2.push(tmp3.phenomena[0].txt
                        + (tmp3.begin ? " began " + tmp3.begin.toLocaleTimeString().replace(/\b(\d{1,2}:\d{2}):\d{2}/, "$1"):"")
                        + (tmp3.end   ? " ended " +   tmp3.end.toLocaleTimeString().replace(/\b(\d{1,2}:\d{2}):\d{2}/, "$1"):"")
                    );
                }

                if( tmp2.length ) {
                    tmp = tmp2.shift();

                    res.txt = tmp2.join(tmp2.join(" ").match(/,/) ? "; " : ", ");
                    res.txt = res.txt ? [res.txt, tmp].join(" and ") : tmp;
                }

            } else if( key.match(/^\$$/) ) {
                res.station_maintenence = true;
                res.txt = "automated station requires maintenence";

            } else {
                res._other_remark = true;
            }
        }

        // NOTE: sometimes single remarks span several tokens, e.g.: 1 1/2SM
        if( !_lookahead_skip )
            ret.push(res);
    }

    var other_remarks = [];
    for(i=ret.length-1; i>=0; i--)
        if( ret[i]._other_remark )
            other_remarks.push( ret.splice(i,1)[0].key );

    if( other_remarks.length )
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
