/* global phantom: true, WebPage: true */

var system = require('system'),
    captureUrl = system.args[1],
    page = new WebPage();

phantom.silent = false;

page.open(captureUrl, function (status) {
    if (!phantom.silent) {
        if (status !== 'success') {
            console.log('phantomjs failed to connect');
            phantom.exit(1);
        }

        console.log('phantomjs capturing on ' + captureUrl);

        page.onConsoleMessage = function (msg) {
            console.info(msg);
        };

        page.onAlert = function (msg) {
            console.error(msg);
        };
    }
});