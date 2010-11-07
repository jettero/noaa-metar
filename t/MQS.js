 
var http = require('http'),
    url  = require('url');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var metar = url.parse(req.url, true).query.m;

    res.end(decode_metar(metar) + "\n");

}).listen(8152, "127.0.0.1");

var fs = require('fs');
eval(fs.readFileSync("metar.js", 'utf8'));
