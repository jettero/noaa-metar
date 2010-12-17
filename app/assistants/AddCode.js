/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo $H location_data
*/

function AddCodeAssistant(args) {
    this._MA = Mojo.Controller.stageController.topScene().assistant;
}

/* {{{ */ AddCodeAssistant.prototype.setup = function() {
	Mojo.Log.info("AddCodeAssistant()::setup()");

    var attrs = {
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/LocationItem',
        emptyTemplate: 'misc/empty'
    };

    this.locations_model = {listTitle: '-or- Tap A Region', items: []};

    if( typeof location_data !== 'undefined' ) {
        var states = $H(location_data).keys().sort(function(a,b) { if(a<b) return -1; if (a>b) return 1; return 0; });
        for(var i=0; i<states.length; i++)
            this.locations_model.items.push({ 'location': states[i] });
    }

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

    this.ICAOModel = {
        original: '',
        disabled: false
    };

    this.controller.setupWidget('ICAO', ICAO_attributes, this.ICAOModel);
    this.controller.setupWidget('manual_add', {}, {label: "Add Code"} );
    Mojo.Event.listen(this.controller.get("manual_add"), Mojo.Event.tap, this.addCode.bind(this));
};

/*}}}*/
/* {{{ */ AddCodeAssistant.prototype.addCode = function(event) {
    var ICAO = this.ICAOModel.original.strip().toUpperCase();

    Mojo.Log.info("AddCode::addCode(%s)", ICAO);

    if (!ICAO.match(/^[A-Z]{4}$/)) {
        Mojo.Controller.errorDialog('Bad ICAO airport code, or code not understood: ' + ICAO);
        return;
    }

    this._MA.addCode(ICAO);
    Mojo.Controller.stageController.popScene();
};

/*}}}*/
/* {{{ */ AddCodeAssistant.prototype.listClickHandler = function(event) {
    Mojo.Log.info("AddCode::listClickHandler(%s)", event.item.location);
    this.controller.stageController.assistant.showScene('AddCode2', [event.item.location]);
};

/*}}}*/

Mojo.Log.info("AddCodeAssistant()");
