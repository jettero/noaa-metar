/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo $H location_data
*/

function DecoderAssistant(args) {
    this.METAR = args[0].METAR
    this.code  = args[0].code
}

DecoderAssistant.prototype.setup = function() {
    Mojo.Log.info("DecoderAssistant::setup() code=%s METAR=%s", this.code, this.METAR);

    var attrs = {
        swipeToDelete: true,
        reorderable:   true,
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/DecodeItem',
        emptyTemplate: 'misc/empty'
    };

    this.decodeModel = {items: $A([{key:'test', value:'test'}])};
    this.controller.setupWidget('decode', attrs, this.decodeModel);


};

Mojo.Log.info("DecoderAssistant()");
