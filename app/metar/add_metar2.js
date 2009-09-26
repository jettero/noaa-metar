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

    var options = {
        name:    "gweather_locations",
        version: 1,
        replace: false, // opening existing if possible
    };

    var dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });

    this.our_locations = {};
    dbo.simpleGet("locations",
        function(locations) { this.our_locations = locations.evalJSON(); }.bind(this),

        function(transaction, error) {
            Mojo.Controller.errorDialog("Can't open account database (#" + error.message + ").");

        }.bind(this)
    );
    this.our_locations[event.item.location] = event.item.data;

    Mojo.Log.info("[built our_locations]");
    dbo.simpleAdd("locations", Object.toJSON(this.our_locations),
        function() {
            message = 'This location has been added to your location database.';

            this.controller.showAlertDialog({
                onChoose: function(value) {
                    Mojo.Controller.stageController.popScene();
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

Add_metar2Assistant.prototype.activate = function(event) {
}

Add_metar2Assistant.prototype.deactivate = function(event) {
}

Add_metar2Assistant.prototype.cleanup = function(event) {
    // XXX: What needs to be cleaned up?  Seriously.  Does any of this clean
    // itself up? or do you have to go through and destroy each object and
    // click handler?
}
