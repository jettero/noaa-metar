function StageAssistant() {
	Mojo.Log.info("StageAssistant()")
}

StageAssistant.prototype.setup = function() {
	Mojo.Log.info("StageAssistant()::setup()")
    this.controller.assistant.showScene('tasks', 'list_t');
}

StageAssistant.prototype.showScene = function (directory, sceneName, args) {
	Mojo.Log.info("StageAssistant()::showScene(%s, %s)", directory, sceneName)

	if (args === undefined) {
		this.controller.pushScene({name: sceneName, sceneTemplate: directory + "/" + sceneName});

	} else {
		this.controller.pushScene({name: sceneName, sceneTemplate: directory + "/" + sceneName}, args);
	}
};

StageAssistant.prototype.handleCommand = function (event) {
	// this.controller = Mojo.Controller.stageController.activeScene();
    // I have this bound to the current scene, so ... this isn't necessary

    if(event.type == Mojo.Event.command) {	
		switch (event.command) {
			// these are built-in commands. we haven't enabled any of them, but
			// they are listed here as part of the boilerplate, to be enabled later if needed
			case 'do-myPrefs':
				this.controller.showAlertDialog({
				    title: $L("Prefs Menu"),
				    message: $L("You have selected the prefs menu"),
					choices:[
         				{label:$L('Thanks'), value:"refresh", type:'affirmative'}
						]				    
				    });			
				break;	

			case 'do-locations':
                Mojo.Log.info("showing locations list... hopefully...");
                Mojo.Controller.stageController.assistant.showScene('settings', 'list_l');
				break;
		}
	}
}

StageAssistant.prototype.menu_setup = function (event) {
    this.appMenuModel = {
        visible: true,
        items: [
            { label: $L('Locations...'), command: 'do-locations' },
        ]
    };

    this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: false}, this.appMenuModel);
}

Mojo.Log.info('loaded(stage-assistant.js)');
