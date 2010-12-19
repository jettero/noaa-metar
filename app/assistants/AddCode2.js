/*jslint white: false, onevar: false, laxbreak: true, maxerr: 500000
*/
/*global Mojo location_data $H
*/

function AddCode2Assistant(args) {
    this.state = args[0];
    this._MA = Mojo.Controller.stageController.topScene().assistant._MA;
    // NOTE: evidentally, "topScene" means parentScene... pfft.
}

AddCode2Assistant.prototype.setup = function() {
	Mojo.Log.info("AddCode2::setup()");

    var attrs = {
        listTemplate:  'misc/listcontainer',
        itemTemplate:  'misc/LocationItem',
        emptyTemplate: 'misc/empty'
    };

    this.locationsModel = {listTitle: $L('Choose City'), items: []};

    var cities = $H(location_data[this.state]).keys().sort(function(a,b) {
        if(a<b) return -1; if (a>b) return 1; return 0; });

    for(var i=0; i<cities.length; i++) {
        var d = location_data[this.state][cities[i]];

        this.locationsModel.items.push({
            'location': "<div class='label'>" + d.code + "</div>" + d.name,
            'data': d });
    }

    this.controller.setupWidget('noaa_locations', attrs, this.locationsModel);
	Mojo.Event.listen(this.controller.get("noaa_locations"), Mojo.Event.listTap, this.listClickHandler.bind(this));
};

AddCode2Assistant.prototype.listClickHandler = function(event) {
    var code = event.item.data.code;
    Mojo.Log.info("AddCode2::listClickHandler(%s)", code);

    this._MA.addCode(code);

    Mojo.Controller.stageController.popScene();
    Mojo.Controller.stageController.popScene();
};

Mojo.Log.info("AddCode2Assistant()");
