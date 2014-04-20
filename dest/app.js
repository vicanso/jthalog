(function() {
  var JTStatsClient, config, jtHalog;

  jtHalog = require('./index');

  config = require('./config');

  JTStatsClient = require('jtstats_client');

  jtHalog.start({
    logPath: config.getLogPath(),
    port: config.port,
    host: config.host,
    statsClient: new JTStatsClient({
      prefix: 'haproxy.'
    })
  });

}).call(this);
