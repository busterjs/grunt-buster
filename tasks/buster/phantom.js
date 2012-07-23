var system = require('system'),
    captureUrl = system.args[1];

phantom.silent = false;

var page = new WebPage();

page.open(captureUrl, function(status) {
  if(!phantom.silent) {
    if (status !== 'success') {
      console.log('phantomjs failed to connect');
      phantom.exit(1);
    }

    console.log('phantomjs capturing on ' + captureUrl);

    page.onConsoleMessage = function (msg, line, id) {
      var composedMsg = '';
      var fileName = id ? id.split('/') : null;
      // format the output message with filename, line number and message
      // weird gotcha: phantom only uses the first console.log argument it gets :(
      composedMsg = fileName ? fileName[fileName.length-1]+', ' : '';
      composedMsg = line ? line +': ' : '';
      composedMsg = msg;
      console.log(composedMsg);
    };

    page.onAlert = function(msg) {
      console.log(msg);
    };
  }
});