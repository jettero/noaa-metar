/*jslint white: false, onevar: false, maxerr: 500000, regexp: false
*/
/*global Mojo setTimeout $A hex_md5
*/

var CHANGELOG = [
    [ '2011-04-30', '0.9.26', "I'm not actually qualified to translate things to other langauges, so I'm not going to do it anymore." ],
    [ '2011-04-30', '0.9.26', "Added this changelog." ]
];

var CHANGELOG_KEY    = "K:" + hex_md5(CHANGELOG.each(function(c){ return c.join("-"); }).join("|"));
var CHANGELOG_COOKIE = new Mojo.Model.Cookie("ChangeLog");

function ChangeLogAssistant() {
    Mojo.Log.info("ChangeLog()");
    CHANGELOG = $A(CHANGELOG);
}

ChangeLogAssistant.prototype.setup = function() {
    Mojo.Log.info("ChangeLog::setup()");

    var clv = CHANGELOG_COOKIE.get();

    this.OKModel          = { label: $L("OK, I read this."), command: CHANGELOG_KEY };
    this.DoneModel        = { label: $L("Done"),             command: CHANGELOG_KEY };
    this.commandMenuModel = { label: 'ChangeLog Commands', items: [ ] };

    if( clv === CHANGELOG_KEY ) {
        this.commandMenuModel.items = [ {}, this.DoneModel, {} ];

    } else {
        setTimeout(function(){
            this.commandMenuModel.items = [ {}, this.OKModel, {} ];
            this.controller.modelChanged(this.commandMenuModel);

        }.bind(this), 4e3);
    }

    this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.commandMenuModel);

    var changelogItems = [];
    this.changelogModel = {listTitle: 'ChangeLog', items: changelogItems };
    CHANGELOG.each(function(i){
        var j = { date: i[0], version: i[1], text: i[2] };

        if( changelogItems.length ) {
            var k = changelogItems[changelogItems.length-1];
            if( k.date === j.date && k.version === j.version ) {
                k.text = j.text + " " + k.text;
                return;
            }
        }

        changelogItems.push(j);
    });

    this.changelogAttrs = {
        listTemplate:  'misc/naked-list-container',
        emptyTemplate: 'misc/empty-list',
        itemTemplate:  'misc/li-changelog',
    };

    this.controller.setupWidget('changelog', this.changelogAttrs, this.changelogModel);
};

ChangeLogAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("ChangeLog::handleCommand()");

    if (event.type === Mojo.Event.command) {
        var s_a = event.command.split(/\s*(?:@@)\s*/);

        if( s_a[0].match(/^K:[a-f0-9]{32}$/) ) {
            Mojo.Log.info("ChangeLog::handleCommand() K, read this");
            CHANGELOG_COOKIE.put(s_a[0]);
            Mojo.Controller.stageController.popScene();
            return;

        } else {
            Mojo.Log.info("ChangeLog::handleCommand(unknown command: %s)", Object.toJSON(s_a));
        }
    }

};

Mojo.Log.info('loaded(ChangeLog.js)');
