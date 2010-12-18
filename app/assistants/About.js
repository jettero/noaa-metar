function AboutAssistant() {
    this.buildDate = new Date(Mojo.loadJSONFile(Mojo.appPath + "build_date.json"));
}

AboutAssistant.prototype.setup = function() {
    this.controller.get("build-date").update(
        "This instance was built on " + this.buildDate.toLocaleString() + "."
    );

    if( OPT.liteMode ) {
        $$(".hide-when-lite").each(function(e){e.setStyle({display: 'none'});});
        $$(".show-when-lite").each(function(e){e.setStyle({display: 'block'});});
    }
};

Mojo.Log.info("About()");
