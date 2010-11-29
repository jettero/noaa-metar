/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo
*/

var OPT;

function StageAssistant() {
	Mojo.Log.info("StageAssistant()");

    OPT = Mojo.loadJSONFile(Mojo.appPath + "runtime_options.json");

    var pc = new Mojo.Model.Cookie("OPT.prefs");

    OPT.loadPrefs = function() {
        var l = pc.get();

        if( l )
            for( var k in l ) {
                if( OPT[k] != null )
                    OPT[k] = l[k];
            }
    };

    OPT.savePrefs = function() {
        var x = {};

        for( var k in OPT ) {
            if( typeof OPT[k] !== "function" )
                x[k] = OPT[k];
        }

        pc.put(x);
    };
}

StageAssistant.prototype.setup = function() {
	Mojo.Log.info("StageAssistant()::setup()");

    this.controller.assistant.showScene('METAR');

    this.controller.lockOrientation = function() {
        this.setWindowOrientation(this.getWindowOrientation());
    };

    this.controller.freeOrientation = function() {
        this.setWindowOrientation("free");
    };
};

StageAssistant.prototype.showScene = function (sceneName, args) {
	Mojo.Log.info("StageAssistant()::showScene(%s)", sceneName);

	if (args === undefined) {
		this.controller.pushScene({name: sceneName, sceneTemplate: sceneName});

	} else {
		this.controller.pushScene({name: sceneName, sceneTemplate: sceneName}, args);
	}
};

StageAssistant.prototype.handleCommand = function(event) {
    // NOTE: if the stageassistant and the sceneassistant both have a
    // handleCommand, they *both* receive commands

    if(event.type === Mojo.Event.command) {
        var cmd = event.command;
        Mojo.Log.info("StageAssistant::handleCommand(%s)", cmd);

        var a;
        if( a = cmd.match(/^myshow-(.+)/) )
            Mojo.Controller.stageController.assistant.showScene(a[1]);

        else switch( cmd ) {
            default:
                Mojo.Log.info("StageAssistant::handleCommand(%s): unknown menu command", cmd);
                break;
        }
    }
};

StageAssistant.prototype.menuSetup = function() {
    this.appMenuModel = {
        visible: true,
        items: [
            { label: "Help",  command: 'myshow-Help'  },
            { label: "About", command: 'myshow-About' },
            { label: "Report Metar Decode", command: 'report-metar', disabled: true }
        ]
    };

    this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
};

Mojo.Log.info('loaded(stage-assistant.js)');
