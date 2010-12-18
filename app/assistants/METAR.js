/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo OPT get_metar $H $A setTimeout setInterval clearInterval abort_all
*/

function METARAssistant() {
    this.receiveMETARData = this.receiveMETARData.bind(this);
    this.updateTimer = this.updateTimer.bind(this);

    this.SCa = Mojo.Controller.stageController.assistant;
    this.menuSetup = this.SCa.menuSetup.bind(this);

    this.dbRecv = this.dbRecv.bind(this);
    this.dbSent = this.dbSent.bind(this);
    this.dbFail = this.dbFail.bind(this);

    this.IamMETAR = true;

    var options = {
        name:    "noaametar_locations", // skip MTS
        version: 1,
        replace: false // opening existing if possible
    };

    this.dbo = new Mojo.Depot(options, function(){}, function(t,r){
        Mojo.Controller.errorDialog("Can't open location database (#" + r.message + ").");
    });
}

/* {{{ */ METARAssistant.prototype.setup = function() {
    Mojo.Log.info("METAR::setup()");

    this.menuSetup();

    this.controller.setupWidget('force_update', {type: Mojo.Widget.activityButton}, {label: "Force Update"} );

    this.refreshModel = { label: "Reload", icon: 'refresh',       command: 'refresh' };
    this.swapModel    = { label: "Reload", icon: 'sync',          command: 'swap'    };
    this.stopModel    = { label: 'Stop',   icon: 'load-progress', command: 'stop'    };
    this.addModel     = { label: "Add",    icon: 'new',           command: 'add'     };
    this.commandMenuModel = {
        label: 'Command Menu',
        items: [ (OPT.showTAF ? {items:[this.addModel, this.swapModel]} : this.addModel), this.refreshModel ]
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

    if( !OPT.liteMode )
        Mojo.Event.listen(this.controller.get("noaa_metar"), Mojo.Event.listTap,     this.decode.bind(this));

    this.loadLocations();
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.mvCode = function(event) {
    Mojo.Log.info("METAR::mvCode(code=%s, from=%d, to=%d): ", event.item.code, event.fromIndex, event.toIndex);

    /*
    ** Rhino 1.7 release 2 2010 01 20
    ** js> var x = [1,2,3,4,5]; x.splice(0,1,x.splice(3,1,x[0])[0]); x
    ** 4,2,3,1,5
    */

    var i = this.METARModel.items;
    i.splice(event.fromIndex,1, i.splice(event.toIndex,1, i[event.fromIndex])[0]);

    this.saveLocations(true);
    // NOTE: Mojo already fudged the visible index; it's important to not
    // modelChanged() until *this* callstack is complete ... later is fine.
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.rmCode = function(event) {
    Mojo.Log.info("METAR::rmCode(code=%s): ", event.item.code);

    this.METARModel.items = this.METARModel.items.reject(function(i){ return event.item === i; });
    this.saveLocations();
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.addCode = function(code) {
    Mojo.Log.info("METAR::addCode(%s)", code);

    this.METARModel.items.push({ code: code,
        fetched_metar: 0, metar_fails: 0, // skip MTS
          fetched_taf: 0,   taf_fails: 0, // skip MTS
        TAF: code, METAR: code });        // skip MTS

    this.saveLocations();
    this.updateTimer();
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.decode = function(event) {
    Mojo.Log.info("METAR::decode(%s)", event.item.code);
    this.controller.stageController.assistant.showScene('METARDecoder', [event.item]);
};

/*}}}*/

/* {{{ */ METARAssistant.prototype.saveLocations = function(skipModelChanged) {
    Mojo.Log.info("METAR::saveLocations() items=%s", Object.toJSON(this.METARModel.items));

    this.dbo.simpleAdd("METARModelItems", // skip MTS
        this.METARModel.items, this.dbSent, this.dbFail);

    if( skipModelChanged )
        return;

    this.controller.modelChanged(this.METARModel);
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.loadLocations = function() {
    Mojo.Log.info("METAR::loadLocations()");

    this.dbo.simpleGet("METARModelItems", this.dbRecv, this.dbFail); // skip MTS
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
        this.METARModel.items[res.index].preMETAR      = res.preMETAR;
        this.METARModel.items[res.index].METAR         = res.METAR;
        this.METARModel.items[res.index].fetched_metar = this.now();
        this.METARModel.items[res.index].metar_fails    = 0;
        this.saveLocations();

        if( !res.cached ) {
            Mojo.Log.info("trying to set success-color on list item.");

            try {
                var node = this.controller.get("noaa_metar").mojo.getNodeByIndex(res.index).select(
                    "div.metar-text")[0]; // skip MTS

                node.style.color = "#009900";
                setTimeout(function(){ node.style.color = "#007700"; }, 1000);
                setTimeout(function(){ node.style.color = "#005500"; }, 1100);
                setTimeout(function(){ node.style.color = "#000000"; }, 1200);

            } catch(e) {
                Mojo.Log.error("error setting success-color: %s", e);
            }
        }

    } else {
        this.METARModel.items[res.index].metar_fails ++;

        if( this.METARModel.items[res.index].metar_fails >= 3 ) {
            Mojo.Controller.errorDialog("failed at " + res.code + " 3 times already, giving up on it.");
            this.METARModel.items[res.index].METAR = res.code + " :(";
        }
    }

    this._running = false;
    this.progress();
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
        var o = (now - j.fetched_metar) > 3000;

        if( (!j.fetched_metar || o) ) {

            if( i === 0 )
                this.started();

            this._updating_index = [ i, this.METARModel.items.length ];
            this._running = true;
            get_metar({code: j.code, index: i}, this.receiveMETARData);
            return;
        }
    }

    this.stopped();
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
            case 'swap':
                Mojo.Log.info("swaping METAR/TAF "); // skip MTS

                this.stopped(); // abort all and reset the refresh button
                Mojo.Controller.stageController.popScene();

                if( this.IamMETAR ) // skip MTS
                     this.controller.stageController.assistant.showScene('TAF');
                else this.controller.stageController.assistant.showScene('METAR'); // skip MTS

                break;

            case 'refresh':
                Mojo.Log.info("forcing updates");
                this.METARModel.items.each(function(i){ i.fetched_metar = 0; });
                this.updateTimer();
                break;

            case 'stop':
                Mojo.Log.info("aborting updates");
                this.stopped();
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

/* {{{ */ METARAssistant.prototype.started = function() {
    this.commandMenuModel.items.pop(this.refreshModel);
    this.commandMenuModel.items.push(this.stopModel);
    this.controller.modelChanged(this.commandMenuModel);

    this.currLoadProgressImage = 0;
    this.currentLoadPercent    = 0;
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.stopped = function() {
    this.commandMenuModel.items.pop(this.stopModel);
    this.commandMenuModel.items.push(this.refreshModel);
    this.controller.modelChanged(this.commandMenuModel);
    this._running = false;
    abort_all();
};

/*}}}*/
/* {{{ */ METARAssistant.prototype.progress = function() {
    try {
        var percent = parseInt(( (this._updating_index[0]+1) / this._updating_index[1])*100, 10);

        Mojo.Log.info("[metar progress computer] percent: (%d/%d)*100=%d",
            this._updating_index[0]+1, this._updating_index[1], percent);

        if (percent > 100) {
            percent = 100;

        } else if (percent < 0) {
            percent = 0;
        }

        if( percent < this.currentLoadPercent )
            return;

        this.currentLoadPercent = percent;

        // Convert the percentage complete to an image number
        // Image must be from 0 to 23 (24 images available)
        var image = Math.round(percent / 3.9);
        if (image > 26)
            image = 26;

        Mojo.Log.info("[metar progress computer] percent: %d; image: %d", percent, image);

        if (image < this.currLoadProgressImage)
            return;

        // Has the progress changed?
        if (this.currLoadProgressImage != image) {
            var icon = this.controller.select('div.load-progress')[0];

            if( icon )
                icon.setStyle({'background-position': "0px -" + (image * 48) + "px"});

            this.currLoadProgressImage = image;
        }

    } catch (e) {
        Mojo.Log.logException(e, e.description);
    }

};

/*}}}*/

Mojo.Log.info("METAR()");
