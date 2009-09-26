function Add_metar2Assistant(args) {
	Mojo.Log.info("Add_metar2Assistant()");

    this.state = args[0];
}

Add_metar2Assistant.prototype.setup = function() {
	Mojo.Log.info("Add_metar2Assistant()::setup()");

    var attrs = {
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/LocationItem',
        emptyTemplate: 'metar/misc/empty',
    };

    this.locations_model = {listTitle: $L('Choose City'), items: []};

    var cities = Object.keys(location_data[this.state]).sort(function(a,b) { if(a<b) return -1; if (a>b) return 1; return 0; });
    for(var i=0; i<cities.length; i++)
        this.locations_model.items.push({ 'location': cities[i], data: location_data[this.state][cities[i]] });

    this.controller.setupWidget('gw_locations', attrs, this.locations_model);
	Mojo.Event.listen(this.controller.get("gw_locations"), Mojo.Event.listTap, this.listClickHandler.bind(this));
}

Add_metar2Assistant.prototype.listClickHandler = function(event) {
    Mojo.Log.info("[clicked] ", event.item.location);
}

Add_metar2Assistant.prototype.activate = function(event) {
}

Add_metar2Assistant.prototype.deactivate = function(event) {
}

Add_metar2Assistant.prototype.cleanup = function(event) {
    // XXX: What needs to be cleaned up?  Seriously.  Does any of this clean
    // itself up? or do you have to go through and destroy each object and
    // click handler?
}
