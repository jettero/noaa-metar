/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo $A decode_metar
*/

function METARDecoderAssistant(args) {
    this.METAR = args[0].METAR
    this.code  = args[0].code

    this.SCa = Mojo.Controller.stageController.assistant;
    this.menuSetup = this.SCa.menuSetup.bind(this);
}

METARDecoderAssistant.prototype.setup = function() {
    Mojo.Log.info("METARDecoderAssistant::setup() code=%s METAR=%s", this.code, this.METAR);

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

METARDecoderAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("METARDecoderAssistant::handleCommand()");

    if (event.type === Mojo.Event.command) {
        var s_a = event.command.split(/\s*(?:@@)\s*/);

        switch (s_a[0]) {
            case 'report-metar':
                Mojo.Log.info("Sending user to reporting page for metar: %s", this.METAR);
                this.controller.serviceRequest("palm://com.palm.applicationManager", {
                    method: "open",
                    parameters:  {
                       id: 'com.palm.app.browser',
                       params: {
                           target: "https://spreadsheets.google.com/viewform?formkey=dGhXLWY4a0NtNXJVSTdVUTR3ZEdiMkE6MQ&entry_6="
                           + escape(this.METAR)
                       }
                    }
                });    
                break;

            default:
                Mojo.Log.info("Tasks::handleCommand(unknown command: %s)", Object.toJSON(s_a));
                break;
        }
    }

};

/*}}}*/

Mojo.Log.info("METARDecoderAssistant()");
