// Requires
var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');
var contextMenu = require('sdk/context-menu');
var data = require("sdk/self").data;
var _ = require('sdk/l10n').get;
var prefs = require('sdk/simple-prefs').prefs;

// Global function to open given URL in Wayback Machine
var openInWaybackMachine = function (url) {
	tabs.activeTab.url = prefs.wayback_machine_url +  url;
}

// 1. Button - open current page in Wayback Machine
var button = buttons.ActionButton({
	id: "btn-open-in-wayback-machine",
	label: _("button_label"),
	icon: {
		'16': './icon-16.png',
		'32': './icon-32.png',
		'64': './icon-64.png'
	},
	onClick: function (state) {
		openInWaybackMachine(tabs.activeTab.url);
	}
});

// 2. Context menu - open link in Wayback Machine
var menuItem = contextMenu.Item({
	label: _("context_menu_item_label"),
	context: contextMenu.SelectorContext('a[href]'),
	contentScriptFile: data.url("context-menu-content-script.js"),
	onMessage: function (url) {
		openInWaybackMachine(url);
	}
});

