// This is the content script for context menu item.
// It tells the context menu item object the "href" attribute of the node which was right-clicked onto.
self.on("click", function (node, data) {
	self.postMessage(node.href);
});
