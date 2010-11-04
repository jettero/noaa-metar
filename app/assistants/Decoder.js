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

    var attrs = {
        swipeToDelete: false,
        reorderable:   false,
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/DecodeItem',
        emptyTemplate: 'misc/empty'
    };

    this.decodeModel = {items: decode_metar(this.METAR)};
    this.controller.setupWidget('decode', attrs, this.decodeModel);
    this.controller.get("code").update(this.code);

    Mojo.Log.info("items: %s", Object.toJSON(this.decodeModel.items));
};

Mojo.Log.info("DecoderAssistant()");
