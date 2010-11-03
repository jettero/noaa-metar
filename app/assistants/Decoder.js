/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo $H location_data
*/

function DecoderAssistant(args) {
    this.METAR = args[0].METAR
    this.code  = args[0].code
}

DecoderAssistant.prototype.activate = function() {
    Mojo.Log.info("DecoderAssistant::activate() code=%s METAR=%s", this.code, this.METAR);

};

Mojo.Log.info("DecoderAssistant()");
