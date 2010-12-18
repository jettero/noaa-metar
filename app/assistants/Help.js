function HelpAssistant() {
}

HelpAssistant.prototype.setup = function() {
    if( OPT.liteMode ) {
        $$(".hide-when-lite").each(function(e){e.setStyle({display: 'none'});});
        $$(".show-when-lite").each(function(e){e.setStyle({display: 'block'});});
    }
};

Mojo.Log.info("Help()");
