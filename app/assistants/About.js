function AboutAssistant() {
    this.buildDate = new Date(Mojo.loadJSONFile(Mojo.appPath + "build_date.json"));
}

AboutAssistant.prototype.setup = function() {
    this.controller.get("build-date").update(
        "This instance was built on " + this.buildDate.toLocaleString() + "."
    );
};

Mojo.Log.info("About()");
