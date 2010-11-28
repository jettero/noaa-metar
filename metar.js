/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/

/* {{{ */ var PDB = { // Phenomena text DataBase

    // descriptor (2)
    MI: "shallow", PR: "partial", BC: "patches of", DR: "low drifting", BL: "blowing", FZ: "freezing",
    TS: "thunderstorms", SH: "showers",

    // precipitation (3)
    DZ: "drizzle", RA: "rain", SN: "snow", SG: "snow grains", IC: "ice crystals", PL: "ice pellets",
    GR: "hail", GS: "small hail and/or snow pellets", UP: "unknown precipitation",

    // obscuration (4)
    BR: "mist", FG: "fog", FU: "smoke", VA: "volcanic ash", DU: "widespread dust", SA: "sand",
    HZ: "haze", PY: "spray",

    // other (5)
    PO: "well-developed dust/sand whirls", SQ: "squalls",
    FC: "funnel cloud", SS: "sandstorm", DS: "duststorm",

    DIRS: {
        N:   "north",
        NE:  "north-east",
        E:   "east",
        SE:  "south-east",
        S:   "south",
        SW:  "south-west",
        W:   "west",
        NW:  "north-west",

        'N-NE': "north by north-east",
        'NE-N': "north by north-east",
        'N-NW': "north by north-west",
        'NW-N': "north by north-west",

        'E-NE': "east by north-east",
        'NE-E': "east by north-east",
        'E-SE': "east by south-east",
        'SE-E': "east by south-east",

        'S-SE': "south by south-east",
        'SE-S': "south by south-east",
        'S-SW': "south by south-west",
        'NW-S': "south by south-west",

        'W-NW': "west by north-west",
        'NW-W': "west by north-west",
        'W-SW': "west by south-west",
        'SW-W': "west by south-west"
    }
};

/*}}}*/

/* {{{ */ function my_parseint(ilike, units, singular, sep) {
    ilike = ilike.replace(/^M/, "-").replace(/[^0-9-]/g, "").replace(/^0+/, ""); // STFU

    if( ilike.length === 0 )
        ilike = "0";

    if( sep == null ) // STFU
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

    if( sep == null ) // STFU
        sep = " ";

    if( flike.match(/\//) ) {
        var i,y, x = flike.split(/ /);
        flike = 0.0;
        for(i=0; i<x.length; i++) {
            if( x[i].match(/^\d+$/) ) {
                flike += parseInt(x[i],10);

            } else if( y = x[i].match(/^(\d+)\/(\d+)$/) ) {
                flike += parseInt(y[1],10) / parseInt(y[2],10);

            } else {
                // should raise an error here, meh
            }
        }

    } else {
        flike = flike.replace(/^M/, "-").replace(/[^0-9.-]/g, "").replace(/^0+/, ""); // STFU

        if( flike.length === 0 )
            flike = "0";

        if( flike === "." )
            flike = "0";
    }

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
    var msplit = metar.toUpperCase().split(/\s+/);
    var lsplit = [];
    var ret = [];

    ret.toString = function() {
        var _tmp = [];

        for(var i=0; i<this.length; i++)
            _tmp.push( [this[i].key, this[i].txt].join(": ") );

        return _tmp.join("\n");
    };

    var date_ob;

    var p2s = function() {
        if( this.length === 1 )
            return PDB[this[0]];

        var m = this.length-2;
        var r = "";

        for(var i=0; i<m; i++)
            r += PDB[this[i]] + ', ';

        return r + PDB[this[m]] + " and " + PDB[this[m + 1]];
    };

    var my_parse_hhmm = function(a1,a2) {
        var my_date = new Date(date_ob);
        var parts;

        if( a1 && a2 ) {
            my_date.setUTCHours( a1 );
            my_date.setUTCMinutes( a2 );

        } else if( parts = a1.match(/(\d{2})(\d{2})/) ) {
            my_date.setUTCHours( parts[1] );
            my_date.setUTCMinutes( parts[2] );

        } else {
            my_date.setUTCMinutes( a1 );
        }

        my_date.toString = function() {
            return this.toLocaleTimeString().replace(/\b(\d{1,2}:\d{2}):\d{2}/, "$1");
        };

        return my_date;
    };

    var i;
    var parts; // as needed regex result parts (see wind)
    var tmp,tmp2,tmp3,key,res,remark_section=false,_lookahead_skip=0;

    var next_key = function(x) { if( !x ) x=0; return msplit[x] || ""; };
    var last_key = function(x) { if( !x ) x=0; return lsplit[x] || ""; };

    while(msplit.length) {
        if( _lookahead_skip > 0 )
            _lookahead_skip --;

        if( key )
            lsplit.unshift(key);

        res = { key: key=msplit.shift(), txt: "<div class='unknown-decode'>unknown</div>" };

        if( _lookahead_skip>0 )
            continue;

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

            else if( parts = key.match(/^(VRB|[0-9]{3})([0-9]+)(?:G([0-9]+))?KT$/) ) {
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
                        res.wind.direction = my_parseint( tmp.deg, '⁰', '⁰', '' );
                        res.txt += " at " + res.wind.direction;
                    }

                    if( tmp.gusts ) {
                        res.wind.gusts = my_parseint( tmp.gusts, "knots" );
                        res.txt += " — gusting to " + res.wind.gusts;
                    }
                }
            }

            else if( parts = key.match(/^(\d+)V(\d+)/) ) {
                res.wind_varies_between = [my_parseint(parts[1], '⁰', '⁰', ''), my_parseint(parts[2], '⁰', '⁰', '')];
                res.txt = "wind is variable between " + res.wind_varies_between.join(" and ");
            }

            else if( key.match(/^M?\d+$/) && next_key().match(/\d+SM$/) ) {
                // 1 1/4SM
                msplit[0] = [key, msplit[0]].join(" ");
                _lookahead_skip = 1;
            }

            else if( key.match(/^M?\d+$/) && next_key() === "SM" ) {
                // 10 SM ; technically this is illegal, but we can figure it out...
                msplit[0] = [key, msplit[0]].join("");
                _lookahead_skip = 1;
            }

            else if( parts = key.match(/^(M)?([\d \/]+)SM$/) ) {
                res.visibility = my_parsefloat(parts[2], "statute miles" );
                res.less_than  = parts[1] ? true : false;
                res.txt = "visibility is " + (res.less_than ? "less than " : "") + res.visibility;
            }

            else if( parts = key.match(/R(\d+)(L|R|C)?\/(M|P)?(\d+)(V(M|P)?(\d+))?FT/) ) {
                // js> "R15L/4000VP6000FT".match(/R(\d+)(L|R|C)?\/(M|P)?(\d+)(V(M|P)?(\d+))?FT/)
                // R15L/4000VP6000FT,15,L, ,4000,VP6000,P,6000
                // 0                  1 2 3    4      5 6 7

                res.runway = parts[1];
                tmp = "runway-" + res.runway;
                if( parts[2] ) {
                    res.approach_from = parts[2];
                    tmp += " (" + ( res.approach_from==="C" ? "center" :
                                    res.approach_from==="L" ? "left" : "right" ) + " approach)";
                }

                res.visual_range = my_parseint(parts[4], "ft");
                if( parts[3] )
                    res.visual_range_mod = parts[3];

                if( parts[5] ) {
                    res.max_visual_range = my_parseint(parts[7], "ft");
                    if( parts[6] )
                        res.max_visual_range_mod = parts[6];

                    res.txt = tmp + " visual range varies between "
                        + (res.visual_range_mod ? (res.visual_range_mod==="M" ? "less than ":"more than "):"")
                        + res.visual_range
                        + " and "
                        + (res.max_visual_range_mod ? (res.max_visual_range_mod==="M" ? "less than ":"more than "):"")
                        + res.max_visual_range;

                } else {
                    res.txt = tmp + " visual range is "
                        + (res.visual_range_mod ? (res.visual_range_mod==="M" ? "less than ":"more than "):"")
                        + res.visual_range;
                }
            }

            else if( parts = key.match(/R(\d+)(L|R|C)?\/(M|P)?(\d+)(V(M|P)?(\d+))?FT/) ) {
                // js> "R15L/4000VP6000FT".match(/R(\d+)(L|R|C)?\/(M|P)?(\d+)(V(M|P)?(\d+))?FT/)
                // R15L/4000VP6000FT,15,L, ,4000,VP6000,P,6000
                // 0                  1 2 3    4      5 6 7

                res.runway = parts[1];
                tmp = "runway-" + res.runway;
                if( parts[2] ) {
                    res.approach_from = parts[2];
                    tmp += " (" + ( res.approach_from==="C" ? "center" :
                                    res.approach_from==="L" ? "left" : "right" ) + " approach)";
                }

                res.visual_range = my_parseint(parts[4], "ft");
                if( parts[3] )
                    res.visual_range_mod = parts[3];

                if( parts[5] ) {
                    res.max_visual_range = my_parseint(parts[7], "ft");
                    if( parts[6] )
                        res.max_visual_range_mod = parts[6];

                    res.txt = tmp + " visual range varies between "
                        + (res.visual_range_mod ? (res.visual_range_mod==="M" ? "less than ":"more than "):"")
                        + res.visual_range
                        + " and "
                        + (res.max_visual_range_mod ? (res.max_visual_range_mod==="M" ? "less than ":"more than "):"")
                        + res.max_visual_range;

                } else {
                    res.txt = tmp + " visual range is "
                        + (res.visual_range_mod ? (res.visual_range_mod==="M" ? "less than ":"more than "):"")
                        + res.visual_range;
                }
            }

            else if( parts = key.match(/^(\d{4})(N|NE|E|SE|S|SW|W|NW|NDV)?$/) ) {
                // NOTE: this is not FMH-1, WMO — evidentally they were fed up with statute miles and went to meters
                res.visibility = my_parseint( parts[1], "m" );
                if( parts[2] )
                    res.direction  = parts[2];

                res.txt = "visibility is " + res.visibility;
                if( res.direction ) {
                    if( res.direction === "NDV" )
                        res.txt += " (sensor not direction capable)";

                    else
                        res.txt += " to the " + PDB.DIRS[res.direction];
                }

                if( parts[1] === "0000" )
                    res.txt = "visibility less than 50 m";

                if( parts[1] === "9999" )
                    res.txt = "visibility greater than 10 km";
            }

            else if( key === "CAVOK" ) {
                // NOTE: WMO, not FMH-1
                // three simultaneous conditions: no clouds, no weather, visibility >10km
                res.txt = "clear skies, visibility perfect, no detectable weather events";
            }

            else if( key === "SKC" ) {
                res.automated = false;
                res.clear_sky = true;
                res.txt = "clear skies";
            }

            else if( key === "CLR" ) {
                res.automated = true;
                res.clear_sky = true;
                res.txt = "clear skies (automated observation)";
            }

            else if( key === "BLO" && next_key().match(/^\d+$/) ) {
                msplit[0] = [key, msplit[0]].join(" ");
                _lookahead_skip = 1;
            }

            else if( parts = key.match(/BLO ?(\d+)/) ) {
                tmp = parts[1];
                tmp += parts[1].length === 2 ? "000" : "00";
                // NOTE: sometimes we get BLO 12 (which is below 12,000?) and
                // sometimes we get BLO 250 (which is almost certainly 25,000?)
                // these are non-standard, so if I get it wrong, who cares.

                res.txt = "clear below " + my_parseint( tmp, "ft" ) + " (informal)";
            }

            else if( key === "FIRST" ) { res.txt = "first report"; }
            else if( key === "LAST"  ) { res.txt = "last report"; }

            else if( parts = key.match(/^(VV|FEW|SC[TK]|BKN|[0O]VC)(\d+|\/\/\/)(CB|TCU)?$/) ) {
                res.layer_type = parts[1];
                if( res.layer_type === "SCK" )
                    res.layer_type = "SCT";

                if( parts[2] === "///" ) {
                    res.layer_altitude = "below sensor";

                    res.txt = {
                        FEW: "few clouds below sensor",
                        SCT: "scattered clouds below sensor",
                        BKN: "broken clouds below sensor",
                        OVC: "overcast below sensor",
                      '0VC': "overcast below sensor"

                    }[res.layer_type];

                } else {
                    tmp = parts[2] || "";
                    tmp += "00";

                    res.layer_altitude = my_parseint( tmp, "ft" );

                    res.txt = [{

                        VV:  "indefinite ceiling, vertical visibility to",
                        FEW: "few clouds at",
                        SCT: "scattered clouds at",
                        BKN: "broken clouds at",
                        OVC: "overcast at",
                      '0VC': "overcast at"

                    }[res.layer_type], res.layer_altitude].join(" ");
                }

                if( parts[3] ) {
                    tmp = parts[3] === "CB" ? "cumulonimbus" : "towering cumulonimbus";
                    res[ tmp.replace(/ /, "_") + "_clouds" ] = true;
                    res.txt = res.txt.replace(/clouds/, tmp).replace(/overcast/, "overcast by" + tmp);
                }
            }

            else if( parts = key.match(/^([M-]?\d+)\/([M-]?\d+)?$/) ) {
                res.temperature = my_parseint( parts[1], "⁰C", "⁰C", "");

                if( parts[2] ) {
                    res.dewpoint = my_parseint( parts[2], "⁰C", "⁰C", "");
                    res.txt = "temperature: " + res.temperature + ", dewpoint: " + res.dewpoint;

                } else {
                    res.txt = "temperature: " + res.temperature + ", dewpoint: unavailable";
                }
            }

            else if( parts = key.match(/^A(3|\d{2})(\d{1,3})?$/) ) {
                // NOTE: technically this should always be A\d{2}\d{2}, but
                // occasionally some automated stations produce (eg) A298 for
                // 29.80 sometimes we even get 29999 too I'm even seeing A3
                // from time to time... A2 would never be this, but A3000 might
                // turn to A3 on buggy gear, so we allow A3, but not A2.

                if( !parts[2] )
                    parts[2] = "0"; // pfft, I see A30 and things from time to time, it's clear to me they mean inHg

                if( parts[1].length < 2 )
                    parts[1] += "0";

                parts.shift();
                res.altimeter_setting = my_parsefloat( parts.join("."), "inHg" );
                res.txt = "set altimeter to " + res.altimeter_setting;
            }

            else if( parts = key.match(/^Q(\d{4})/) ) {
                // NOTE: WMO METAR manual is fairly non-specific about what this pressure reading is for...
                res.pressure = my_parsefloat( parts[1], "hPa" );
                res.txt = "pressure is " + res.pressure;
            }

            else if( key === "AUTO" ) {
                res.fully_automated = true;
                res.txt = "fully automated report";
            }

            else if( key === "COR" ) {
                res.correction = true;
                res.txt = "corrected report";
            }

            else if( parts = key.match(/^(-|\+|[+-]?VC)?(TS|SH)((RA|SN|PL|GS|GR)*)$/) ) {
                // NOTE The TS and SH descriptors are not well behaved.  TS in
                // particular isn't sure if it's colmun 2 or 3.  TS gets 0 or
                // more precipitation types, SH gets 1 more more, forgive the
                // use of *

                res.intensity  = parts[1]; // intensity or proximity (1)
                res.descriptor = parts[2]; // descriptor (2)
                res.phenomena  = parts[3].match(/(..)/g) || []; // precipitation type (3)
                res.phenomena.toString = p2s;

                if( res.descriptor === "TS" ) {
                    res.txt = res.phenomena.length ? "thunderstorm with " + res.phenomena : "thunderstorm";

                } else {
                    res.txt = res.phenomena.length === 1
                            ? res.phenomena + " showers" : "showers of " + res.phenomena;
                }

                if( res.intensity ) {
                    if( res.intensity === "-VC" )
                        res.txt += " (light) in the vicinity"; // technically invalid, but we can see what they mean

                    else if ( res.intensity === "+VC" )
                        res.txt += " (heavy) in the vicinity"; // technically invalid, but we can see what they mean

                    else if ( res.intensity === "VC" )
                        res.txt += " in the vicinity";

                    else res.txt = (res.intensity === "+" ? "heavy " : "light ") + res.txt;
                }
            }

            else if( parts = key.match(/^(-|\+|[+-]?VC)?(MI|PR|BC|DR|BL|TS|FZ)?((DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)+)$/) ) {
                // NOTE: the html FMH-1 shows SS for duststorm, but they clearly mean DS
                res.intensity  = parts[1]; // intensity or proximity (1)
                res.descriptor = parts[2]; // descriptor (2)
                res.phenomena  = parts[3].match(/(..)/g); // precipitation (3), obscuration (4), or other (5)
                res.phenomena.toString = p2s;
                // '-RASNGS,-,,RASNGS,GS'

                if( res.descriptor )
                    res.txt = PDB[res.descriptor] + " " + res.phenomena;

                else res.txt = res.phenomena.toString();

                if( res.intensity ) {
                    if( res.intensity === "-VC" ) {
                        res.txt += " (light) in the vicinity"; // technically invalid, but we can see what they mean

                    } else if ( res.intensity === "+VC" ) {
                        res.txt += " (heavy) in the vicinity"; // technically invalid, but we can see what they mean

                    } else if ( res.intensity === "VC" ) {
                        res.txt += " in the vicinity";

                    } else {
                        if( res.phenomena[0] === "FC" && res.intensity === "+" )
                            res.txt = "tornado or waterspout";
                            // NOTE: FC is always "funnel cloud", when it's
                            // intense, it's a tornado. This is how fmh-1 says
                            // to do it.  They also say FC is never coded with
                            // other phenomena, which is handy, we can just use [0]

                        else
                            res.txt = (res.intensity === "+" ? "heavy " : "light ") + res.txt;
                    }
                }
            }

            else if( key.match(/^RMKS?$/) ) {
                remark_section = true;
                res.remarks_follow = true;
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

            else if( key === "FIRST" ) { res.txt = "first report"; }
            else if( key === "LAST"  ) { res.txt = "last report"; }

            } else if( parts = key.match(/^SLPNO$/) ) {
                res.txt = "sea level pressure unavailable";

            } else if( parts = key.match(/^SLP(\d+)(\d)$/) ) {
                tmp = [ parts[1], parts[2] ].join(".");
                res.sea_level_pressure = my_parsefloat(tmp.match(/^[6789]/) ? '9'+tmp : '10'+tmp, 'hPa');
                res.txt = "sea level pressure is " + res.sea_level_pressure;

            } else if( parts = key.match(/^(1|2)(0|1)(\d{2})(\d{0,1})$/) ) {
                tmp = my_parsefloat( (parts[2] === "1" ? "-" : "") + [parts[3],parts[4]].join("."), "⁰C", "⁰C", "" );

                if( parts[1] === "1" ) {
                    res.maximum_temperature_6h = tmp;
                    res.txt = "6-hour maximum temperature is " + tmp;

                } else {
                    res.minimum_temperature_6h = tmp;
                    res.txt = "6-hour minimum temperature is " + tmp;
                }

            } else if( parts = key.match(/^(3|6|7)([\d\/]{2})([\d\/]{0,2})$/) ) {
                tmp = parts[2] === "//" ? "unknown" : my_parsefloat([parts[2],parts[3]].join("."), "in");

                if( parts[1] === "3" ) {
                    // NOTE: FMH-1 is really fuzzy about the 3- hour
                    // precipitation group... it hints around about 3RRRR, but
                    // doesn't explicitly state there is a 3RRRR.  See the
                    // section on 6RRRR.

                    res.precipitation_amount_3h = tmp;
                    res.txt = "3-hour precipitation amount is " + tmp;

                } else if (parts[1] === "6") {
                    // NOTE: the 6- group is well defined though
                    res.precipitation_amount_6h = tmp;
                    res.txt = "6-hour precipitation amount is " + tmp;

                } else {
                    // NOTE: the 7- group has its own section as well
                    res.precipitation_amount_24h = tmp;
                    res.txt = "24-hour precipitation amount is " + tmp;
                }

            } else if( parts = key.match(/^4(\d)(\d{2})(\d)(\d)(\d{2})(\d)$/) ) {
                tmp  = my_parsefloat( (parts[1] === "1" ? "-" : "") + [parts[2],parts[3]].join("."), "⁰C", "⁰C", "" );
                tmp2 = my_parsefloat( (parts[4] === "1" ? "-" : "") + [parts[5],parts[6]].join("."), "⁰C", "⁰C", "" );

                res.maximum_temperature_24h = tmp;
                res.minimum_temperature_24h = tmp2;

                res.txt = "24-hour maximum temperature is " + tmp + " minimum is " + tmp2;

            } else if( parts = key.match(/^4\/(\d{3})$/) ) {
                res.snow_ground_accumulation = my_parseint( parts[1], "in" );
                res.txt = "ground accumulation of snow is " + res.snow_ground_accumulation;

            } else if( parts = key.match(/^5(\d)(\d{2})(\d{0,1})$/) ) {
                tmp = {

                    // FMH-1 Ch12 table 12-7 is utterly baffling, this is
                    // literally the best I could do, and it's still pretty
                    // much a guess; e.g., 0 and 5 appear in multiple rows, and
                    // the trend descriptions seem to be random adjectives
                    // unioned together with commas and conjunctives.
                    // In short: translations welcome.

                    0: "higher than 3 hours ago by",
                    1: "higher than 3 hours ago by",
                    2: "higher than 3 hours ago by",
                    3: "higher than 3 hours ago by",

                    4: "same as 3 hours ago Δ",

                    5: "lower than 3 hours ago by",
                    6: "lower than 3 hours ago by",
                    7: "lower than 3 hours ago by",
                    8: "lower than 3 hours ago by"

                }[parts[1]];

                res.pressure_tendency_3h_trend  = parts[1];
                res.pressure_tendency_3h_amount = my_parsefloat( [parts[2],parts[3]].join("."), "hPa" );
                res.txt = "3-hour pressure tendency is " + tmp + " " + res.pressure_tendency_3h_amount;

            } else if( parts = key.match(/^8\/(\d|\/)(\d|\/)(\d|\/)$/) ) {
                // this is not listed in FMH-1 anywhere that I can tell...
                // I got it from some random website: http://www.utexas.edu/depts/grg/kimmel/GRG301K/grg301kmetars.html

                res.low_clouds = {
                    '/': 'overcast', // is this possible on the Cl layer?

                    0:   "no clouds",
                    1:   "cumulus (fair weather)",
                    2:   "cumulous (towering)",
                    3:   "cumulonimbus (no anvil)",

                    4:   "stratocumulus (from cumulus)", // what does from cumulus mean here?
                    5:   "stratocumulus (not from cumulus)",
                    6:   "stratus (in sheet or layer)",

                    7:   "cumulus fractus",
                    8:   "cumulus and cirrostratus",
                    9:   "cumulonimbus (with anvil-head)"
                }[parts[1]];

                res.middle_clouds = {
                    '/': 'overcast',

                    0:   "no clouds",
                    1:   "altostratus (sun visibile)",
                    2:   "altostratus (thick, no sun visible)",
                    3:   "altocumulus (semitransparent)",

                    4:   "altocumulus (patchy)",
                    5:   "altocumulus (thickening)",
                    6:   "altocumulus (from cumulus or cumulonimbus)",

                    7:   "altocumulus (with altostratus or nibostratus)",
                    8:   "altocumulus (with turrets)",
                    9:   "altocumulus (chatoic)"
                }[parts[2]];

                res.high_clouds = {
                    '/': 'overcast',

                    0:   "no clouds",
                    1:   "cirrus (filaments)",
                    2:   "cirrus (dense)",
                    3:   "cirrus (often left from cumulonimbus)",

                    4:   "cirrus (filaments thickening)",
                    5:   "cirrus or cirrostratus (low on horizon)",
                    6:   "cirrus or cirrostratus (high in sky)",

                    7:   "cirrostratus (covering entire sky)",
                    8:   "cirrostratus (not covering entire sky)",
                    9:   "cirrocumulus or cirrus with cirrostratus"
                }[parts[3]];

                res.txt = "low cloud layer is " + res.low_clouds
                        + ", middle cloud layer is " + res.middle_clouds
                        + ", high cloud layer is " + res.high_clouds;

            } else if( parts = key.match(/^933(\d{2})(\d{0,1})$/) ) {
                res.snow_ground_accumulation_we = my_parsefloat( [parts[1],parts[2]].join("."), "in" );
                res.txt = "ground accumulation of snow is " + res.snow_ground_accumulation_we + " (water equivalent)";

            } else if( parts = key.match(/^98(\d{3})$/) ) {
                res.minutes_of_sunshine = my_parseint(parts[1], 'min');
                res.txt = "the previous day saw sunshine for " + res.minutes_of_sunshine;

            } else if( parts = key.match(/^T(\d)(\d{2})(\d)(\d)(\d{2})(\d)$/) ) {
                tmp = [parts[2], parts[3]].join(".");
                tmp = parts[1]==="1" ? '-' + tmp : tmp;
                res.hourly_temperature = my_parsefloat( tmp, '⁰C', '⁰C', '' );

                tmp = [parts[5], parts[6]].join(".");
                tmp = parts[4]==="1" ? '-' + tmp : tmp;
                res.hourly_dewpoint = my_parsefloat( tmp, '⁰C', '⁰C', '' );

                res.txt = "hourly temperature is " + res.hourly_temperature
                        + ", hourly dewpoint is "  + res.hourly_dewpoint;

            } else if( parts = key.match(/^P(\d{2}\d{2})$/) ) {
                res.precipitation = my_parsefloat( [parts[1],parts[2]].join("."), "inches" );
                res.txt = res.precipitation[0]===0
                        ? "no hourly precipitation" : "hourly precipitation is " + res.precipitation;

            } else if( key.match(/^((MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PL|GR|GS)+(B\d{2,4}|E\d{2,4})+)+$/) ) {
                // NOTE: this is evil ... TSB0159E30, SHRAB05E30SHSNB20E55, RAB05E30SNB20E55, etc ... are all legal
                tmp = key.match(/(MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PL|GR|GS)+(B\d{2,4}|E\d{2,4})+/g);
                tmp2 = [];

                res.phenomena_begin_end = [];

                for(i=0; i<tmp.length; i++) {
                    parts = tmp[i].match(/((MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PL|GR|GS)+)(B(\d{2})(\d{2})?)?(E(\d{2})(\d{2})?)?/);
                    //js> "SHRAB0107E07".match(/((MI|PR|BC|DR|BL|TS|FZ|SH|TS|DZ|RA|SN|SG|IC|PL|GR|GS)+)(B(\d{2})(\d{2})?)?(E(\d{2})(\d{2})?)?/);
                    //SHRAB0107E07,SHRA,RA,B0107,01 ,07,E07,  07,
                    //SHRAB07E0107,SHRA,RA,B07  ,07 ,  ,E0107,01,07
                    //SHRAE03,     SHRA,RA,     ,   ,  ,E03,  03,
                    // 0           1    2  3     4   5  6     7  8

                    res.phenomena_begin_end.push(tmp3 = { phenomena: decode_metar(parts[1]) });

                    if( parts[3] )
                        tmp3.begin = my_parse_hhmm(parts[4], parts[5]);

                    if( parts[6] )
                        tmp3.end = my_parse_hhmm(parts[7], parts[8]);

                    tmp2.push(
                        tmp3.phenomena[0].txt
                            + (tmp3.begin ? " began " + tmp3.begin : "")
                            + (tmp3.end   ? " ended " +   tmp3.end : "")
                    );
                }

                if( tmp2.length ) {
                    tmp = tmp2.shift();

                    res.txt = tmp2.join(tmp2.join(" ").match(/,/) ? "; " : ", ");
                    res.txt = res.txt ? [res.txt, tmp].join(" and ") : tmp;
                }

            } else if( key.match(/^(CHI|VIS)NO$/) ) {
                msplit[0] = [key, msplit[0]].join(" ");
                _lookahead_skip = true;

            } else if( parts = key.match(/^(PWI|RVR|P|FZRA|TS|CHI|VIS)NO( (.+))?$/) ) {
                res.sensor_fail = parts[1];
                res.txt = {
                    PWI:  "present weather identifier",
                    RVR:  "runway visual range",
                    P:    "precipitation",
                    FZRA: "freezing rain",
                    TS:   "lightning",
                    CHI:  "ceiling height",
                    VIS:  "secondary visibility"
                }[res.sensor_fail];

                res.txt += " sensor failure";
                if( parts[2] )
                    res.txt += " on/at " + parts[2];

            } else if( key.match(/^(TWR|SFC)$/) && next_key() === "VIS" ) {
                _lookahead_skip = true;

            } else if( key === "VIS" ) {
                tmp2 = 0;
                tmp3 = 0;

                if( next_key().match(/^(N|NE|E|SE|S|SW|W|NW)$/) ) {
                    tmp2++; tmp3++;
                }

                while( next_key(tmp3++).match(/^[\d V\/]+$/) )
                    tmp2++;

                tmp = msplit.splice(0,tmp2);
                tmp.unshift(key);

                if( last_key().match(/^(TWR|SFC)$/) )
                    tmp.unshift(last_key());

                if( next_key().match(/^RWY/) )
                    tmp.push(msplit.shift());

                msplit.unshift( tmp.join(" ") );
                _lookahead_skip = true;

            } else if( parts = key.match(/^((TWR|SFC) )?VIS ((N|NE|E|SE|S|SW|W|NW) )?([\d \/]+)(V([\d \/]+))?( (RWY\d+))?$/) ) {
                //                         12               34                       5         6 7           8 9

                res.visibility = my_parsefloat(parts[5], "statute miles");

                res.txt = "visibility";

                if( parts[1] ) {
                    res.visibility_type = parts[2];
                    res.txt = [ { TWR: "tower", SFC: "surface" }[res.visibility_type], res.txt].join(" ");
                }

                if( parts[6] ) {
                    res.visibility_varies_to = my_parsefloat(parts[7], "statute miles");
                    res.txt += " varies between " + ("" + res.visibility).replace(/ statute.*/, "")
                        + " and " + res.visibility_varies_to;

                } else {
                    res.txt += " is " + res.visibility;
                }

                if( parts[3] ) {
                    res.direction = parts[4];
                    res.txt += " to the " + PDB.DIRS[res.direction];
                }

                if( parts[8] ) {
                    res.sensor_location = parts[9];
                    res.txt += " at " + res.sensor_location;
                }

            } else if( key.match(/^(OCNL|FRQ|CONS)$/) && next_key().match(/^LTG/) ) {
                tmp = "FREQ_TOKEN";
                _lookahead_skip = true;

            } else if( key === "GS" ) {
                tmp = /^[\d \/]+$/;
                tmp2 = 0; tmp3 = 0;
                while( next_key(tmp3++).match(tmp) )
                    tmp2++;

                tmp = msplit.splice(0,tmp2);
                tmp.unshift(key);

                msplit.unshift(tmp.join(" "));

                _lookahead_skip = true;

            } else if( parts = key.match(/^GS ([\d \/]+)$/) ) {
                res.hailstone_size = my_parsefloat(parts[1], "inches");
                res.txt = "hailstone maximal diameter is " + res.hailstone_size;

            } else if( key === "CIG" && next_key().match(/^[\dV]*$/) ) {
                msplit[0] = [key, msplit[0]].join(" ");
                _lookahead_skip = true;

            } else if( parts = key.match(/^CIG (\d+)V(\d+)$/) ) {
                res.variable_ceiling = {
                    min: my_parseint(parts[1]+"00", "feet"), max: my_parseint(parts[2]+"00", "feet")
                };

                res.txt = "ceiling varies between " + (res.variable_ceiling.min.toString().replace(/ feet$/,""))
                    + " and " + res.variable_ceiling.max;

            } else if( key.match(/^(FEW|SCT|BKN|OVC)\d*$/) && next_key() === "V" && next_key(1).match(/^(FEW|SCT|BKN|OVC)$/) ) {
                tmp = msplit.splice(0,2);
                tmp.unshift(key);
                msplit.unshift( tmp.join(" ") );
                _lookahead_skip = true;

            } else if( parts = key.match(/(FEW|SCT|BKN|OVC)(\d*) V (FEW|SCT|BKN|OVC)$/) ) {
                res.changing_sky_condition = {
                    from: parts[1], to: parts[3]
                };

                tmp = {
                    FEW: "layer of few clouds",
                    SCT: "scattered cloud layer",
                    BKN: "broken cloud layer",
                    OVC: "overcast cloud layer"
                };

                if( parts[2] ) {
                    res.changing_sky_condition.from_height = my_parseint(parts[2]+"00", "feet");
                    res.txt = "the " + tmp[res.changing_sky_condition.from] + " at " + res.changing_sky_condition.from_height
                            + " varies to a " + tmp[res.changing_sky_condition.to];

                } else {
                    res.txt = "the " + tmp[res.changing_sky_condition.from] + " varies to a " + tmp[res.changing_sky_condition.to];
                }

            } else if( key.match(/^(BR|FG|FU|VA|DU|SA|HZ|PY)$/) && next_key().match(/^(FEW|SCT|BKN|OVC)\d+$/) ) {
                msplit[0] = [key, msplit[0]].join(" ");
                _lookahead_skip = true;

            } else if( parts = key.match(/^(BR|FG|FU|VA|DU|SA|HZ|PY) (FEW|SCT|BKN|OVC)(\d+)$/) ) {
                res.obscuration  = parts[1];
                res.sky_cover    = parts[2];
                res.cover_height = my_parseint(parts[3]+"00", "feet");

                res.txt = PDB[res.obscuration];

                res.txt += {
                    FEW: " covering 1/8-2/8 of the sky",
                    SCT: " covering 3/8-4/8 of the sky",
                    BKN: " covering 5/8-7/8 of the sky",
                    OVC: " covering most of the sky"
                }[res.sky_cover];

                res.txt += " at " + res.cover_height.toString().replace(/^0 feet/, "ground level");

            } else if( key.match(/^(TS|CB|CBMAM|TCU|ACC|SCSL|ACSL|CCSL)$/) && next_key().match( tmp = /^([NEWS]{1,2}|[NEWS]{1}-[NEWS]{2}|[NEWS]{2}-[NEWS]{1}|MOV|DSNT)$/ ) ) {
                tmp2 = 0; tmp3 = 0;
                while( next_key(tmp3++).match(tmp) )
                    tmp2++;

                tmp = msplit.splice(0,tmp2);
                tmp.unshift(key);

                msplit.unshift(tmp.join(" "));

                _lookahead_skip = true;

            } else if( parts = key.match(/^TS( ([NEWS]{1,2}|[NEWS]{1}-[NEWS]{2}|[NEWS]{2}-[NEWS]{1}))?( MOV ([NEWS]{1,2}|[NEWS]{1}-[NEWS]{2}|[NEWS]{2}-[NEWS]{1}))?$/) ) {
                //                   1 2                      3     4

                if( parts[1] )
                    res.thunderstorm_location = parts[2];

                if( parts[3] )
                    res.thunderstorm_movement = parts[4];

                if( res.thunderstorm_location && res.thunderstorm_movement )
                    res.txt = "thunderstorm to the " + PDB.DIRS[res.thunderstorm_location]
                            + " moving "             + PDB.DIRS[res.thunderstorm_movement];

                else if( res.thunderstorm_location )
                    res.txt = "thunderstorm to the " + PDB.DIRS[res.thunderstorm_location];

                else if( res.thunderstorm_movement )
                    res.txt = "thunderstorm in the area moving " + PDB.DIRS[res.thunderstorm_movement];

            } else if( key.match(/^LTG(CG|IC|CC|CA)*$/) && (tmp3 === "FREQ_TOKEN" || next_key().match(/^(OHD|VC|DSNT|N|E|S|W|NE|NW|SE|SW)$/)) ) {
                tmp2 = 0;
                tmp3 = 0;

                while( next_key(tmp3++).match(/^(OHD|VC|DSNT|N|E|S|W|NE|NW|SE|SW)$/) )
                    tmp2++;

                if( tmp2 ) {
                    tmp3 = msplit.splice(0, tmp2);
                    tmp3.unshift(key);

                } else {
                    tmp3 = [ key ];
                }

                if( tmp === "FREQ_TOKEN" ) {
                    tmp3.unshift(last_key());
                    tmp = false;
                }

                msplit.unshift( tmp3.join(" ") );

                _lookahead_skip = true;

            } else if( parts = key.match(/^((OCNL|FRQ|CONS) )?(LTG((CG|IC|CC|CA)*))( (OHD|VC|DSNT))?( (N|E|S|W|NE|SE|NW|SW))?$/) ) {
                //                         12                 3   45               6 7              8 9

                if( parts[1] )
                    res.frequency = parts[2];

                if( parts[4] )
                    res.lightning_types = parts[4].match(/(..)/g);

                if( parts[7] )
                    res.range = parts[7];

                if( parts[9] )
                    res.direction = parts[9];

                res.txt = (res.frequency ? {OCNL:"occasional",FRQ:"frequent",CONS:"constant"}[res.frequency]:"") + " lightning";

                if( res.lightning_types ) {
                    tmp = [];
                    tmp3 = {
                        CG: "between cloud and ground",
                        IC: "within clouds",
                        CC: "from cloud to cloud",
                        CA: "between cloud and air" // this can happen? huh.
                    };

                    for(tmp2=0; tmp2<res.lightning_types.length; tmp2++)
                        tmp.push( tmp3[res.lightning_types[tmp2]] );

                    tmp.toString = function() {
                        if( this.length === 1 )
                            return this[0];

                        var m = this.length-2;
                        var r = "";

                        for(var i=0; i<m; i++)
                            r += this[i] + ', ';

                        return r + this[m] + " and " + this[m + 1];
                    };

                    res.txt += " " + "(" + tmp + ")";
                }

                if( res.range )
                    res.txt += { OHD: " overhead", VC: " in the vicinity", DSNT: " in the distance" }[res.range];

                if( res.direction )
                    res.txt += " to the " + PDB.DIRS[res.direction];

            } else if( key === "WSHFT" && next_key().match(/\d+/) ) {
                tmp2 = 1;
                if( next_key(1).match(/FRO/) )
                    tmp2 ++;
                tmp = msplit.splice(0,tmp2);
                tmp.unshift(key);
                msplit.unshift( tmp.join(" ") );
                _lookahead_skip = true;

            } else if( parts = key.match(/^WSHFT (\d+)( FROPA)?$/) ) {
                res.wind_shift = true;
                res.wind_shift_time = my_parse_hhmm(parts[1]);
                res.txt = (parts[2] ? "wind shift due to frontal passage circa " : "wind shift circa ") + res.wind_shift_time;

            } else if( key === "PK" && next_key() === "WND" && next_key(1).match(/(\d{3})(\d{2})(\d?)\/(\d{2,4})/) ) {
                tmp = msplit.splice(0,2);
                tmp.unshift(key);
                msplit.unshift( tmp.join(" ") );
                _lookahead_skip = true;

            } else if( parts = key.match(/^PK WND (\d{3})(\d{2})(\d?)\/(\d{2,4})$/) ) {
                res.peak_wind = {
                    speed:     my_parsefloat( [parts[2], (parts[3]||"0")].join("."), "knots" ),
                    direction: my_parseint(   parts[1], '⁰', '⁰', '' )
                };

                res.peak_wind_time = my_parse_hhmm(parts[4]);
                res.txt = "peak wind was " + res.peak_wind.speed + " at " + res.peak_wind.direction
                    + " circa " + res.peak_wind_time;

            } else if( key.match(/^\$$/) ) {
                res.station_maintenence = true;
                res.txt = "automated station requires maintenence";

            } else {
                res._other_remark = true;
            }
        }

        // NOTE: sometimes single remarks span several tokens, e.g.: 1 1/2SM
        if( _lookahead_skip === 0 )
            ret.push(res);
    }

    var other_remarks = [];
    for(i=ret.length-1; i>=0; i--)
        if( ret[i]._other_remark )
            other_remarks.unshift( ret.splice(i,1)[0].key );

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
