/**
 * This content script defines behavior for the temporary page we'll show to user while we asking Wayback Machine for snapshot URL.
 */

self.port.on('init', function (data) {
    document.getElementById('icon').setAttribute('src', data.icon_url);
    document.getElementById('page-url').textContent = data.page_url;
});

self.port.on('notify', function (data) {
    document.getElementById('icon').setAttribute('class', data.class);
    document.getElementById('title').textContent = data.title;
    document.getElementById('text').textContent = data.text;
});
