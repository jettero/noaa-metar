function Add_metarAssistant(args) {
	Mojo.Log.info("Add_metarAssistant()");
}

Add_metarAssistant.prototype.setup = function() {
	Mojo.Log.info("Add_metarAssistant()::setup()");

    var attrs = {
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/LocationItem',
        emptyTemplate: 'metar/misc/empty',
    };

    this.locations_model = {listTitle: $L('-or- Tap A Region'), items: []};

    var states = Object.keys(location_data).sort(function(a,b) { if(a<b) return -1; if (a>b) return 1; return 0; });
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
    Mojo.Event.listen($("manual_add"), Mojo.Event.tap, this.add_code.bind(this))

    this.our_locations = {};

    var options = {
        name:    "noaametar_locations",
        version: 1,
        replace: false, // opening existing if possible
    };

    this.dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });

    this.dbo.simpleGet("locations",
        function(locations) { if(locations) this.our_locations = locations; }.bind(this),

        function(transaction, error) {
            Mojo.Controller.errorDialog("Can't open location database (#" + error.message + ").");

        }.bind(this)
    );
}

Add_metarAssistant.prototype.add_code = function(event) {
    Mojo.Log.info("[manual add]");

    this.our_locations.blarg = {};

    Mojo.Log.info("[built our_locations]");
    this.dbo.simpleAdd("locations", this.our_locations,
        function() {
            message = 'This location has been added to your location database.';

            this.controller.showAlertDialog({
                onChoose: function(value) {
                    Mojo.Controller.stageController.popScene();
                },
                title:    'Location Added',
                message:  message,
                choices:  [ {label: 'OK', value: 'OK', type: 'color'} ]
            });

            Mojo.Log.info("[added] ", event.item.location);

        }.bind(this),

        function(transaction,result) {
            Mojo.Controller.errorDialog("Database error saving location details: " + result.message);

        }.bind(this)
    );
}

Add_metarAssistant.prototype.listClickHandler = function(event) {
    Mojo.Log.info("[clicked] ", event.item.location);
    this.controller.stageController.assistant.showScene('metar', 'add_metar2', [event.item.location]);
}

Add_metarAssistant.prototype.activate = function(event) {
}

Add_metarAssistant.prototype.deactivate = function(event) {
}

Add_metarAssistant.prototype.cleanup = function(event) {
    // XXX: What needs to be cleaned up?  Seriously.  Does any of this clean
    // itself up? or do you have to go through and destroy each object and
    // click handler?
}
