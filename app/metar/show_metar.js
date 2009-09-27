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
        swipeToDelete: true,
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/METARItem',
        emptyTemplate: 'metar/misc/empty',
        addItemLabel:  $L("Add...")
    };

    this.metar_model = {listTitle: $L('METAR'), items: []};
    this.controller.setupWidget('gw_metar', attrs, this.metar_model);
    Mojo.Event.listen(this.controller.get('gw_metar'), Mojo.Event.listAdd,    this.addMETAR.bindAsEventListener(this));
    Mojo.Event.listen(this.controller.get('gw_metar'), Mojo.Event.listDelete, this.rmMETAR.bindAsEventListener(this));
}

Show_metarAssistant.prototype.rmMETAR = function(event) {
    Mojo.Log.info("rmMETAR(): ", event.item.code);
    delete this.our_locations[event.item.code];
    this.dbo.simpleAdd("locations", Object.toJSON(this.our_locations),
        function() { Mojo.Log.info("[removed] ", event.item.code); }.bind(this),
        function(transaction,result) {
            Mojo.Controller.errorDialog("Database error removing location details: " + result.message);
        }.bind(this)
    );
}

Show_metarAssistant.prototype.addMETAR = function(event) {
    this.controller.stageController.assistant.showScene('metar', 'add_metar');
}

Show_metarAssistant.prototype.receive_metar = function(res) {
    Mojo.Log.info("receive_metar(): ", res.code, res.worked ? "[success]" : "[fail]");

    if( res.worked ) {
        this.metar_model.items[res.index].METAR = res.METAR;
        this.metar_model.items[res.index].fetched = true;
        this.controller.modelChanged(this.metar_model);

    } else {
        this.metar_model.items[res.index].fails ++;

        if( this.metar_model.items[res.index].fails >= 3 ) {
            Mojo.Controller.errorDialog("failed at " + res.code + " 3 times already, giving up on it.");
            this.metar_model.items[res.index].METAR = res.code + " :(";
        }
    }

    for(var i=0; i<this.metar_model.items.length; i++)
        if( !this.metar_model.items[i].fetched && this.metar_model.items[i].fails < 3 ) {
            get_metar({code: this.metar_model.items[i].code, index: i}, this.receive_metar.bind(this));
            return;
        }
}

Show_metarAssistant.prototype.activate = function(event) {
    Mojo.Log.info("fetching list of items for METAR display");

    this.our_locations = {};
    this.dbo.simpleGet("locations",
        function(locations) {
            this.our_locations = locations.evalJSON();

            Mojo.Log.info("found list of items for METAR display, building Mojo List");

            this.metar_model.items = [];
            for(var code in this.our_locations)
                this.metar_model.items.push({
                    METAR:   "fetching " + code + " ("
                        + this.our_locations[code].state + ", " + this.our_locations[code].city 
                        + ") ...",

                    fetched: false,
                    code:    code,
                    city:    this.our_locations[code].city,
                    state:   this.our_locations[code].state,
                    fails: 0,
                });

            this.controller.modelChanged(this.metar_model);
            get_metar({index: 0, code: this.metar_model.items[0].code}, this.receive_metar.bind(this));

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
