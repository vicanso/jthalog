(function() {
  var config, jtHalog;

  jtHalog = require('./index');

  config = require('./config');

  jtHalog.start({
    logPath: config.getLogPath(),
    port: config.port,
    host: config.host
  });

}).call(this);
