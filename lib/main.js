// Requires
var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');
var contextMenu = require('sdk/context-menu');
var data = require("sdk/self").data;
var _ = require('sdk/l10n').get;
var prefs = require('sdk/simple-prefs').prefs;
var Request = require("sdk/request").Request;
var URL = require("sdk/url").URL;
var privateBrowsing = require("sdk/private-browsing");

var workerTab = undefined;
var worker = undefined;

/**
 * @param string url URL which should be checked with Wayback Machine for past snapshots.
 */
var openInWaybackMachine = function (url) {
    tabs.once("load", function (tab) { 
        workerTab = tab;
        worker = tab.attach({contentScriptFile: data.url('show-loading-page-info.js')});
        worker.port.emit('init', {icon_url: data.url('icon-64.png'), title: _("msg_requesting_snapshot", url)});
        Request({
            url: prefs.wayback_machine_url + encodeURIComponent(url),
            onComplete: processWaybackMachineResponse
        }).get();
    });
    tabs.open({
        url: data.url("worker-page.html"),
        isPrivate: privateBrowsing.isPrivate(tabs.activeTab)
    });
};

var processWaybackMachineResponse = function (response) {
    if (response.status !== 200)
        notifyAboutFailedRequest(response);

    if (!response.json
        || !response.json.hasOwnProperty('archived_snapshots'))
        notifyAboutMalformedResponse(response);

    if (response.json.archived_snapshots.closest
        && !response.json.archived_snapshots.closest.url)
        notifyAboutMalformedResponse(response);

    if (!response.json.archived_snapshots.closest)
        notifyAboutNoSnapshotToReturnTo();

    workerTab.url = response.json.archived_snapshots.closest.url;
};

var notifyAboutFailedRequest = function (response) {
    worker.port.emit('notify', {
        title: _("msg_error_connecting_title"),
        text: _("msg_error_connecting_text", response.status, response.text),
        class: 'error-connecting'
    });
};

var notifyAboutMalformedResponse = function (response) {
    worker.port.emit('notify', {
        title: _("msg_malformed_response_title"),
        text: _("msg_malformed_response_text", response.text),
        class: "malformed-data.png"
    });
};

var notifyAboutNoSnapshotToReturnTo = function () {
    worker.port.emit('notify', {
        title: _("msg_no_snapshot_title"),
        text: _("msg_no_snapshot_text"),
        class: "no-snapshot"
    });
};

// 1. Button - open current page in Wayback Machine
var button = buttons.ActionButton({
	id: "btn-open-in-wayback-machine",
	label: _("button_label"),
	icon: {
		'16': './icon-16.png',
		'32': './icon-32.png',
		'64': './icon-64.png'
	},
  onClick: function () {
      var current_url = (new URL(tabs.activeTab.url)).toString(); // poor man's sanitization
      openInWaybackMachine(current_url);
  }
});

// 2. Context menu - open link in Wayback Machine
var menuItem = contextMenu.Item({
	label: _("context_menu_item_label"),
	context: contextMenu.SelectorContext('a[href]'),
	contentScriptFile: data.url("context-menu-content-script.js"),
  onMessage: function (href_url) {
      var url = (new URL(href_url)).toString(); // poor man's sanitization.
      openInWaybackMachine(url);
  }
});

