/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo OPT setTimeout get_metar
*/

function METARAssistant() {
    Mojo.Log.info("METAR()");

    this.receiveData = this.receiveData.bind(this);
    this.dbRecv      = this.dbRecv.bind(this);
    this.updateTimer = this.updateTimer.bind(this);
}

METARAssistant.prototype.setup = function() {
    Mojo.Log.info("METAR::setup()");
    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    var options = {
        name:    "noaametar_locations",
        version: 1,
        replace: false // opening existing if possible
    };

    this.dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });

    var attrs = {
        swipeToDelete: true,
        listTemplate:  'metar/misc/listcontainer',
        itemTemplate:  'metar/misc/METARItem',
        emptyTemplate: 'metar/misc/empty',
        addItemLabel:  "Add..."
    };

    this.metar_model = {listTitle: 'METAR', items: []};
    this.controller.setupWidget('noaa_metar', attrs, this.metar_model);
    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    Mojo.Event.listen(this.controller.get('noaa_metar'),   Mojo.Event.listAdd,    this.addCode.bind(this));
    Mojo.Event.listen(this.controller.get('noaa_metar'),   Mojo.Event.listDelete, this.rmCode.bind(this));
	Mojo.Event.listen(this.controller.get("force_update"), Mojo.Event.tap,        this.force_update.bind(this));

    this.force_update_flag = false;
};

METARAssistant.prototype.rmCode = function(event) {
    Mojo.Log.info("METAR::rmCode(): ", event.item.code);

    delete this.our_locations[event.item.code];

    this.dbo.simpleAdd("locations", this.our_locations,
        function() { Mojo.Log.info("[removed] ", event.item.code); }.bind(this),
        function(transaction,result) {
            Mojo.Controller.errorDialog("Database error removing location details: " + result.message);
        }.bind(this)
    );
};

METARAssistant.prototype.addCode = function() {
    this.controller.stageController.assistant.showScene('AddCode');
};

METARAssistant.prototype.receiveData = function(res) {
    Mojo.Log.info("METAR::receiveData(): ", res.code, res.worked ? "[success]" : "[fail]");

    if( res.worked ) {
        this.metar_model.items[res.index].METAR = res.METAR;
        this.metar_model.items[res.index].fetched = true;
        this.controller.modelChanged(this.metar_model);

        if( !res.cached ) {
            var node = this.controller.get("noaa_metar").mojo.getNodeByIndex(res.index).select("div.METAR")[0];

            Mojo.Log.info("trying to set success-background on list item.");
            node.style.color = "#009900";
            setTimeout(function(){ node.style.color = "#007700"; }, 1000);
            setTimeout(function(){ node.style.color = "#005500"; }, 1100);
            setTimeout(function(){ node.style.color = "#000000"; }, 1200);
        }

    } else {
        this.metar_model.items[res.index].fails ++;

        if( this.metar_model.items[res.index].fails >= 3 ) {
            Mojo.Controller.errorDialog("failed at " + res.code + " 3 times already, giving up on it.");
            this.metar_model.items[res.index].METAR = res.code + " :(";
        }
    }

    for(var i=0; i<this.metar_model.items.length; i++)
        if( !this.metar_model.items[i].fetched && this.metar_model.items[i].fails < 3 ) {
            get_metar({code: this.metar_model.items[i].code, force: this.force_update_flag, index: i}, this.receiveData.bind(this));
            return;
        }

    if( this.force_update_flag ) {
        Mojo.Log.info("deactivating spinner, hopefully");
        this.force_update_flag = false;
        this.controller.get("force_update").mojo.deactivate();
    }
};

METARAssistant.prototype.force_update = function(event) {
    Mojo.Log.info("forcing updates");
    this.force_update_flag = true;
    this.activate();
};

METARAssistant.prototype.updateTimer = function() {
    if( !this.timer_active )
        return;

    Mojo.Log.info("update timer fired");
    this.activate();
};

METARAssistant.prototype.activate = function(event) {
    Mojo.Log.info("fetching list of items for METAR display");

    this.timer_active = true;
    setTimeout( this.updateTimer, 90e3 );

    this.our_locations = {};
    this.dbo.simpleGet("locations", this.dbRecv, this.dbError);
};

METARAssistant.prototype.dbRecv = function(locations) {
    Mojo.Log.info("fetching list of items for METAR display");

    if( locations ) {
        this.our_locations = locations;

        Mojo.Log.info("found list of items for METAR display, building Mojo List");

        if( Object.keys( this.our_locations ).length < 1 ) {
            Mojo.Log.info("deactivating spinner, hopefully");
            this.force_update_flag = false;
            this.controller.get("force_update").mojo.deactivate();
        }

        this.metar_model.items = [];
        for(var code in this.our_locations) {
            var desc = code;
            if( this.our_locations[code].state )
                desc += " (" + this.our_locations[code].state + ", " + this.our_locations[code].city + ") ...";

            this.metar_model.items.push({
                METAR:   "fetching " + desc,
                fetched: false,
                code:    code,
                city:    this.our_locations[code].city,
                state:   this.our_locations[code].state,
                fails: 0
            });
        }

        this.controller.modelChanged(this.metar_model);
        get_metar({index: 0, force: this.force_update_flag, code: this.metar_model.items[0].code}, this.receiveData);
    }

};

METARAssistant.prototype.dbError = function(transaction,error) {
    Mojo.Controller.errorDialog("Can't open location database (#" + error.message + ").");
};

METARAssistant.prototype.deactivate = function(event) {
    Mojo.Log.info("METAR::deactivate()");

    this.timer_active = false;
};
