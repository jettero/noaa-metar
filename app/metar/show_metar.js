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
}
