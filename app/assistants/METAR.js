/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo OPT setTimeout get_metar $H $A
*/

function METARAssistant() {
    Mojo.Log.info("METAR()");

    this.receiveData = this.receiveData.bind(this);
    this.updateTimer = this.updateTimer.bind(this);

    this.SCa = Mojo.Controller.stageController.assistant;
    this.menuSetup = this.SCa.menuSetup.bind(this);

    this.dbRecv = this.dbRecv.bind(this);
    this.dbSent = this.dbSent.bind(this);
    this.dbFail = this.dbFail.bind(this);
}

METARAssistant.prototype.setup = function() {
    Mojo.Log.info("METAR::setup()");
    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    this.refreshModel = { label: "Reload",  icon: 'refresh', command: 'refresh' };
    this.addModel     = { label: "Add",     icon: 'new',     command: 'add'     };
    this.commandMenuModel = {
        label: 'Command Menu',
        items: [ this.addModel, this.refreshModel ]
    };
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.commandMenuModel);

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
        reorderable:   true,
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/METARItem',
        emptyTemplate: 'misc/empty'
    };

    this.METARmodel = {items: []};
    this.controller.setupWidget('noaa_metar', attrs, this.METARmodel);
    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    Mojo.Event.listen(this.controller.get('noaa_metar'), Mojo.Event.listDelete,  this.rmCode.bind(this));
    Mojo.Event.listen(this.controller.get('noaa_metar'), Mojo.Event.listReorder, this.mvCode.bind(this));

    this.forceUpdateFlag = false;
};

METARAssistant.prototype.mvCode = function(event) {
    Mojo.Log.info("METAR::mvCode(code=%s, from=%d, to=%d): ", event.item.code, event.fromIndex, event.toIndex);

    /*
    ** Rhino 1.7 release 2 2010 01 20
    ** js> var x = [1,2,3,4,5]; x.splice(0,1,x.splice(3,1,x[0])); x
    ** 4,2,3,1,5
    */

    var i = this.METARmodel.items;
    i.splice(event.fromIndex,1, i.splice(event.toIndex,1, i[event.fromIndex]));

    this.saveLocations();
};

METARAssistant.prototype.saveLocations = function() {
    var ol = this.ourLocations;

    var counter = 0;
    $A(this.METARmodel.items).each(function(i){
        ol[i.codde]._sort = counter ++;
    });

    this.dbo.simpleAdd("locations", this.ourLocations, this.dbSent, this.dbFail);
};

METARAssistant.prototype.rmCode = function(event) {
    Mojo.Log.info("METAR::rmCode(code=%s): ", event.item.code);

    delete this.ourLocations[event.item.code];

    this.saveLocations();
};

METARAssistant.prototype.receiveData = function(res) {
    Mojo.Log.info("METAR::receiveData(): ", res.code, res.worked ? "[success]" : "[fail]");

    if( res.worked ) {
        this.METARmodel.items[res.index].METAR = res.METAR;
        this.METARmodel.items[res.index].fetched = true;
        this.controller.modelChanged(this.METARmodel);

        if( !res.cached ) {
            var node = this.controller.get("noaa_metar").mojo.getNodeByIndex(res.index).select("div.metar-text")[0];

            Mojo.Log.info("trying to set success-color on list item.");
            try {
                node.style.color = "#009900";
                setTimeout(function(){ node.style.color = "#007700"; }, 1000);
                setTimeout(function(){ node.style.color = "#005500"; }, 1100);
                setTimeout(function(){ node.style.color = "#000000"; }, 1200);

            } catch(e) {
                Mojo.Log.error("error setting success-color: %s", e);
            }
        }

    } else {
        this.METARmodel.items[res.index].fails ++;

        if( this.METARmodel.items[res.index].fails >= 3 ) {
            Mojo.Controller.errorDialog("failed at " + res.code + " 3 times already, giving up on it.");
            this.METARmodel.items[res.index].METAR = res.code + " :(";
        }
    }

    for(var i=0; i<this.METARmodel.items.length; i++)
        if( !this.METARmodel.items[i].fetched && this.METARmodel.items[i].fails < 3 ) {
            get_metar({code: this.METARmodel.items[i].code, force: this.forceUpdateFlag, index: i}, this.receiveData.bind(this));
            return;
        }

    if( this.forceUpdateFlag )
        this.forceUpdateFlag = false;
};

METARAssistant.prototype.updateTimer = function() {
    if( !this.timer_active )
        return;

    Mojo.Log.info("update timer fired");
    this.activate();
};

METARAssistant.prototype.activate = function() {
    Mojo.Log.info("fetching list of items for METAR display");

    this.timer_active = true;
    setTimeout( this.updateTimer, 900e3 );

    this.ourLocations = {};
    this.dbo.simpleGet("locations", this.dbRecv, this.dbFail);
};


METARAssistant.prototype.dbSent = function() { Mojo.Log.info("[db saved]"); };
METARAssistant.prototype.dbRecv = function(locations) {
    Mojo.Log.info("fetching list of items for METAR display");

    if( locations ) {
        var ol;
        this.ourLocations = ol = $H(locations);

        Mojo.Log.info("found list of items for METAR display, building Mojo List");

        if( ol.keys().length < 1 )
            this.forceUpdateFlag = false;

        this.METARmodel.items = [];
        ol.keys().sortBy(function(k){ return k._sort; }).each(function(code){
            var desc = code;
            if( ol[code].state )
                desc += " (" + ol[code].state + ", " + ol[code].city + ") ...";

            this.METARmodel.items.push({
                METAR:   "fetching " + desc,
                fetched: false,
                code:    code,
                city:    ol[code].city,
                state:   ol[code].state,
                fails: 0
            });
        });

        this.controller.modelChanged(this.METARmodel);
        if( this.METARmodel.items.length > 0 )
            get_metar({index: 0, force: this.forceUpdateFlag, code: this.METARmodel.items[0].code}, this.receiveData);
    }

};

METARAssistant.prototype.dbFail = function(transaction,error) {
    Mojo.Controller.errorDialog("Can't open location database (#" + error.message + ").");
};

METARAssistant.prototype.deactivate = function() {
    Mojo.Log.info("METAR::deactivate()");

    this.timer_active = false;
};

METARAssistant.prototype.handleCommand = function(event) {
    if (event.type === Mojo.Event.command) {
        var s_a = event.command.split(/\s*(?:@@)\s*/);

        if( s_a.length > 0 )
            Mojo.Log.info("METAR::handleCommand(%s)", s_a[0]);

        switch (s_a[0]) {
            case 'refresh':
                Mojo.Log.info("forcing updates");
                this.forceUpdateFlag = true;
                this.activate();
                break;

            case 'add':
                Mojo.Log.info("add-code");
                this.controller.stageController.assistant.showScene('AddCode');
                break;

            default:
                Mojo.Log.info("METAR::handleCommand(unknown command: %s)", Object.toJSON(s_a));
                break;
        }
    }

};

/*}}}*/
