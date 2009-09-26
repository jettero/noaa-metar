function Show_metarAssistant() {
    Mojo.Log.info("show_metar()");
}

Show_metarAssistant.prototype.setup = function() {
    Mojo.Log.info("show_metar::setup()");

    var options = {
        name:    "gweather_locations",
        version: 1,
        replace: false, // opening existing if possible
    };

    this.dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });

    var attrs = {
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/METARItem',
        emptyTemplate: 'metar/misc/empty',
        addItemLabel:  $L("Add...")
    };

    this.metar_model = {listTitle: $L('METAR'), items: []};
    this.controller.setupWidget('gw_metar', attrs, this.metar_model);
    Mojo.Event.listen(this.controller.get('gw_metar'), Mojo.Event.listAdd, this.addMETAR.bindAsEventListener(this));
}

Show_metarAssistant.prototype.addMETAR = function(event) {
    this.controller.stageController.assistant.showScene('metar', 'add_metar');
}

Show_metarAssistant.prototype.activate = function(event) {
    Mojo.Log.info("fetching list of items for METAR display");

    this.our_locations = {};
    this.dbo.simpleGet("locations",
        function(locations) {
            this.our_locations = locations.evalJSON();

            Mojo.Log.info("found list of items for METAR display, building Mojo List");

            this.metar_model.items = [];
            for(var l in this.our_locations)
                this.metar_model.items.push({
                    METAR:   "fetching " + this.our_locations[l].code + " ...",
                    fetched: false,
                    code:    this.our_locations[l].code,
                    city:    l,
                    state:   this.our_locations[l].state,
                });
            this.controller.modelChanged(this.metar_model);

        }.bind(this),

        function(transaction, error) {
            Mojo.Controller.errorDialog("Can't open location database (#" + error.message + ").");

        }.bind(this)
    );
}

Show_metarAssistant.prototype.deactivate = function(event) {
}

Add_metar2Assistant.prototype.cleanup = function(event) {
    // XXX: What needs to be cleaned up?  Seriously.  Does any of this clean
    // itself up? or do you have to go through and destroy each object and
    // click handler?
}
