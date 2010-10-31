/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo OPT get_metar $H $A setTimeout setInterval clearInterval
*/

function METARAssistant() {
    this.receiveMETARData = this.receiveMETARData.bind(this);
    this.updateTimer = this.updateTimer.bind(this);

    this.SCa = Mojo.Controller.stageController.assistant;
    this.menuSetup = this.SCa.menuSetup.bind(this);

    this.dbRecv = this.dbRecv.bind(this);
    this.dbSent = this.dbSent.bind(this);
    this.dbFail = this.dbFail.bind(this);

    var options = {
        name:    "noaametar_locations",
        version: 1,
        replace: false // opening existing if possible
    };

    this.dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });
}

/* {{{ */ METARAssistant.prototype.setup = function() {
    Mojo.Log.info("METAR::setup()");
    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    this.refreshModel = { label: "Reload",  icon: 'refresh', command: 'refresh' };
    this.addModel     = { label: "Add",     icon: 'new',     command: 'add'     };
    this.commandMenuModel = {
        label: 'Command Menu',
        items: [ this.addModel, this.refreshModel ]
    };
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.commandMenuModel);

    var attrs = {
        swipeToDelete: true,
        reorderable:   true,
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/METARItem',
        emptyTemplate: 'misc/empty'
    };

    this.METARModel = {items: $A([])};
    this.controller.setupWidget('noaa_metar', attrs, this.METARModel);
    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    Mojo.Event.listen(this.controller.get('noaa_metar'), Mojo.Event.listDelete,  this.rmCode.bind(this));
    Mojo.Event.listen(this.controller.get('noaa_metar'), Mojo.Event.listReorder, this.mvCode.bind(this));

    this.forceUpdateFlag = false;
    this.loadLocations();
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.mvCode = function(event) {
    Mojo.Log.info("METAR::mvCode(code=%s, from=%d, to=%d): ", event.item.code, event.fromIndex, event.toIndex);

    /*
    ** Rhino 1.7 release 2 2010 01 20
    ** js> var x = [1,2,3,4,5]; x.splice(0,1,x.splice(3,1,x[0])); x
    ** 4,2,3,1,5
    */

    var i = this.METARModel.items;
    i.splice(event.fromIndex,1, i.splice(event.toIndex,1, i[event.fromIndex]));
    this.saveLocations();
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.rmCode = function(event) {
    var code = event.item.code;
    Mojo.Log.info("METAR::rmCode(code=%s): ", code);

    this.METARModel.items = this.METARModel.items.reject(function(m){ return m.code === code; });
    this.saveLocations();
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.addCode = function(code) {
    Mojo.Log.info("METAR::addCode(%s)", code);

    this.METARModel.items.push({ code: code, fetched: 0, fails: 0, METAR: code });
    this.saveLocations();
    this.updateTimer();
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.saveLocations = function() {
    Mojo.Log.info("METAR::saveLocations() items=%s", Object.toJSON(this.METARModel.items));

    this.dbo.simpleAdd("METARModelItems", this.METARModel.items, this.dbSent, this.dbFail);
    this.controller.modelChanged(this.METARModel);
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.loadLocations = function() {
    Mojo.Log.info("METAR::loadLocations()");

    this.dbo.simpleGet("METARModelItems", this.dbRecv, this.dbFail);
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.now = function() {
    var d   = new Date();
    var t   = d.getTime();
    var now = Math.round( t/1000.0 );

    return now;
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.receiveMETARData = function(res) {
    Mojo.Log.info("METAR::receiveMETARData() code=%s worked=%s", res.code, res.worked ? "[success]" : "[fail]");

    if( res.worked ) {
        this.METARModel.items[res.index].METAR = res.METAR;
        this.METARModel.items[res.index].fetched = this.now();
        this.METARModel.items[res.index].fails = 0;
        this.saveLocations();

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
        this.METARModel.items[res.index].fails ++;

        if( this.METARModel.items[res.index].fails >= 3 ) {
            Mojo.Controller.errorDialog("failed at " + res.code + " 3 times already, giving up on it.");
            this.METARModel.items[res.index].METAR = res.code + " :(";
        }
    }

    this._running = false;
    this.updateTimer();
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.updateTimer = function() {
    Mojo.Log.info("METAR::updateTimer()");

    // anything that's not fetched should get fetched
    // anything that's old should get re-fetched

    if( this._running )
        return;

    var now = this.now();

    for(var i=0; i<this.METARModel.items.length; i++) {
        var j = this.METARModel.items[i];
        var o = (now - j.fetched) > 3000;

        if( (!j.fetched || o) && j.fails < 3 ) {
            this._running = true;
            get_metar({code: j.code, force: this.forceUpdateFlag || o, index: i}, this.receiveMETARData);
            return;
        }
    }

    if( this.forceUpdateFlag )
        this.forceUpdateFlag = false;
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.dbSent = function() {
    Mojo.Log.info("METAR::dbSent()");
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.dbRecv = function(_in) {
    Mojo.Log.info("METAR::dbRecv(%s)", Object.toJSON(_in));
    var items = $A(_in ? _in : []);

    this.METARModel.items = items;
    this.controller.modelChanged(this.METARModel);
    this.updateTimer();
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.dbFail = function(transaction,error) {
    Mojo.Log.info("METAR::dbFail()");
    Mojo.Controller.errorDialog("Internal database error: " + error.message);
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.activate = function() {
    Mojo.Log.info("METAR::activate()");
    this._updateTimer = setInterval( this.updateTimer, 60e3 );
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.deactivate = function() {
    Mojo.Log.info("METAR::deactivate()");
    clearInterval(this._updateTimer);
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.handleCommand = function(event) {
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

Mojo.Log.info("METAR()");
