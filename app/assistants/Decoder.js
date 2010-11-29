/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo $A decode_metar
*/

function DecoderAssistant(args) {
    this.METAR = args[0].METAR
    this.code  = args[0].code

    this.SCa = Mojo.Controller.stageController.assistant;
    this.menuSetup = this.SCa.menuSetup.bind(this);
}

DecoderAssistant.prototype.setup = function() {
    Mojo.Log.info("DecoderAssistant::setup() code=%s METAR=%s", this.code, this.METAR);

    this.menuSetup();
    this.appMenuModel.items[2].disabled = false;
    this.controller.modelChanged(this.appMenuModel);

    var attrs = {
        swipeToDelete: false,
        reorderable:   false,
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/DecodeItem',
        emptyTemplate: 'misc/empty'
    };

    this.decodeModel = {items: decode_metar(this.METAR)};
    this.controller.setupWidget('decode', attrs, this.decodeModel);

    var dat = function(code) {
        for( var k in location_data )
            for( var l in location_data[k] )
                if( location_data[k][l].code === code )
                    return location_data[k][l].name + "; " + location_data[k][l].city + ", " + location_data[k][l].state;

        return "<div class='unknown-decode'>unknown airport</div>"; // this shouldn't happen, since we clearly know the airport
    };

    this.decodeModel.items.unshift({ key: this.code, txt: dat(this.code) });
};

Mojo.Log.info("DecoderAssistant()");
