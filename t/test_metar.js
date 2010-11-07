
var fs    = require("fs"),
    sys   = require("sys"),
    metar = process.argv[2]; // 0 is node, 1 is this script

eval(fs.readFileSync("metar.js", 'utf8'));
sys.puts(decode_metar(metar));
