function Add_metarAssistant(args) {
	Mojo.Log.info("Add_metarAssistant()");

    //this.dbo = args[0];
}

Add_metarAssistant.prototype.setup = function() {
	Mojo.Log.info("Add_metarAssistant()::setup()");

    var attrs = {
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/LocationItem',
        emptyTemplate: 'metar/misc/empty',
    };

    this.locations_model = {listTitle: $L('Choose State'), items: []};

    var states = Object.keys(location_data).sort(function(a,b) { if(a<b) return -1; if (a>b) return 1; return 0; });
    for(var i=0; i<states.length; i++)
        this.locations_model.items.push({ 'location': states[i] });

    this.controller.setupWidget('gw_locations', attrs, this.locations_model);
	Mojo.Event.listen(this.controller.get("gw_locations"), Mojo.Event.listTap, this.listClickHandler.bind(this));
}

Add_metarAssistant.prototype.listClickHandler = function(event) {
    Mojo.Log.info("clicked!!");
    /*
    if (event.originalEvent.target.hasClassName('title')) {
        Mojo.Log.info("Clicked on " + event.item.data);

        var index = event.model.items.indexOf(event.item);
        Mojo.Log.info("Index is " + index);
    }        
    */
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
