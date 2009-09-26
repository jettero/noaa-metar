function Add_metarAssistant(args) {
	Mojo.Log.info("Add_metarAssistant()");

    //this.dbo = args[0];
}

Create_aAssistant.prototype.setup = function() {
	Mojo.Log.info("Add_metarAssistant()::setup()");

    var attrs = {
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/METARItem',
        emptyTemplate: 'metar/misc/empty',
    };

    this.locations_model = {listTitle: $L('GWeather Locations'), items: ["blarg", "blarg", "blarg"]};
    this.controller.setupWidget('gw_locations', attrs, this.locations_model);
}

Create_aAssistant.prototype.activate = function(event) {
}

Create_aAssistant.prototype.deactivate = function(event) {
}

Create_aAssistant.prototype.cleanup = function(event) {
    // XXX: What needs to be cleaned up?  Seriously.  Does any of this clean
    // itself up? or do you have to go through and destroy each object and
    // click handler?
}