/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo $H $ location_data
*/

function AddCodeAssistant(args) {
	Mojo.Log.info("AddCodeAssistant()");

    this.dbSent = this.dbSent.bind(this);
    this.dbRecv = this.dbRecv.bind(this);
}

AddCodeAssistant.prototype.setup = function() {
	Mojo.Log.info("AddCodeAssistant()::setup()");

    var attrs = {
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/LocationItem',
        emptyTemplate: 'metar/misc/empty'
    };

    this.locations_model = {listTitle: '-or- Tap A Region', items: []};

    var states = $H(location_data).keys().sort(function(a,b) { if(a<b) return -1; if (a>b) return 1; return 0; });
    for(var i=0; i<states.length; i++)
        this.locations_model.items.push({ 'location': states[i] });

    this.controller.setupWidget('noaa_locations', attrs, this.locations_model);
	Mojo.Event.listen(this.controller.get("noaa_locations"), Mojo.Event.listTap, this.listClickHandler.bind(this));

    var ICAO_attributes = {
        // XXX: how many many of these are default?
        hintText:         'e.g., KORD',
        textFieldName:    'ICAO',
        modelProperty:    'original',
        multiline:        false,
        disabledProperty: 'disabled',
        focus:            true,
        modifierState:    Mojo.Widget.capsLock,
        limitResize:      false,
        holdToEnable:     false,
        focusMode:        Mojo.Widget.focusSelectMode,
        changeOnKeyPress: true,
        textReplacement:  false,
        maxLength:        30,
        requiresEnterKey: false
    };

    this.ICAO_model = {
        original: '',
        disabled: false
    };

    this.controller.setupWidget('ICAO', ICAO_attributes, this.ICAO_model);
    this.controller.setupWidget('manual_add', {type: Mojo.Widget.activityButton}, {label: "Add Code"} );
    Mojo.Event.listen(this.controller.get("manual_add"), Mojo.Event.tap, this.addCode.bind(this));

    this.our_locations = {};

    var options = {
        name:    "noaametar_locations",
        version: 1,
        replace: false // opening existing if possible
    };

    this.dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });

    this.dbo.simpleGet("locations", this.dbRecv, this.dbRecvFail);
};

AddCodeAssistant.prototype.dbRecv = function(locations) {
    if(locations)
        this.our_locations = locations;
};

AddCodeAssistant.prototype.dbRecvFail = function(transaction, error) {
    Mojo.Controller.errorDialog("Can't open location database (#" + error.message + ").");
};

AddCodeAssistant.prototype.nospin = function(event) {
    this.controller.get('manual_add').mojo.deactivate();
    this.spinning = false;
};

AddCodeAssistant.prototype.addCode = function(event) {
    Mojo.Log.info("[manual add]");

    var ICAO = this.ICAO_model.original.strip().toUpperCase();

    if( this.spinning ) return;
        this.spinning = true;

    if (!ICAO.match(/^[A-Z]{4}$/)) {
        Mojo.Controller.errorDialog('Bad ICAO airport code, or code not understood: ' + ICAO);
        this.nospin();
        return;
    }

    this.our_locations[ICAO] = {
        // Since this is manual, we don't ahve the city and state and airport
        // name information we would using the our list...

    };

    Mojo.Log.info("[built our_locations]");
    this.dbo.simpleAdd("locations", this.our_locations, this.dbSent, this.dbSendFail);
};

AddCodeAssistant.prototype.dbSent = function(event) {
    Mojo.Log.info("[added] ", event.item.location);
    Mojo.Controller.stageController.popScene();
};

AddCodeAssistant.prototype.dbSendFail = function(transaction,result) {
    Mojo.Controller.errorDialog("Database error saving location details: " + result.message);
};

AddCodeAssistant.prototype.listClickHandler = function(event) {
    Mojo.Log.info("[clicked] ", event.item.location);
    this.controller.stageController.assistant.showScene('AddCode2', [event.item.location]);
};
