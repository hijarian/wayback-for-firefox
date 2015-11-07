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
    tabs.open({
        url: data.url("worker-page.html"),
        isPrivate: privateBrowsing.isPrivate(tabs.activeTab),
        onLoad: function (tab) {
            workerTab = tab;
            worker = tab.attach({contentScriptFile: data.url('show-loading-page-info.js')});
            worker.port.emit('init', {icon_url: data.url('icon-64.png'), page_url: url});
            Request({
                url: "http://archive.org/wayback/available?url=" + encodeURIComponent(url),
                onComplete: processWaybackMachineResponse
            }).get();
        }
    });
};

var processWaybackMachineResponse = function (response) {
    if (response.status !== 200)
        return notifyAboutFailedRequest(response);

    if (!response.json
        || !response.json.hasOwnProperty('archived_snapshots'))
        return notifyAboutMalformedResponse(response);

    if (response.json.archived_snapshots.closest
        && !response.json.archived_snapshots.closest.url)
        return notifyAboutMalformedResponse(response);

    if (!response.json.archived_snapshots.closest)
        return notifyAboutNoSnapshotToReturnTo();

    return workerTab.url = response.json.archived_snapshots.closest.url;
};

var notifyAboutFailedRequest = function (response) {
    worker.port.emit('notify', {
        title: "Error asking Archive.org Wayback Machine for snapshot!",
        text: 'Error code was ' + response.status + ' with response text being "' + response.text + '"',
        class: 'error-connecting'
    });
};

var notifyAboutMalformedResponse = function (response) {
    worker.port.emit('notify', {
        title: "Error asking Archive.org Wayback Machine for snapshot!",
        text: 'Malformed response received from Wayback Machine: "' + response.text + '"',
        class: "malformed-data.png"
    });
};

var notifyAboutNoSnapshotToReturnTo = function () {
    worker.port.emit('notify', {
        title: "No snapshot!",
        text: "We asked, but it seems Archive.org doesn't have snapshots for this page.",
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

