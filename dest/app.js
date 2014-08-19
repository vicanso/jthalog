(function() {
  var JTCluster, JTStatsClient, config, jtCluster, jtHalog, options, start;

  jtHalog = require('./index');

  config = require('./config');

  JTStatsClient = require('jtstats_client');

  start = function() {
    return jtHalog.start({
      logPath: config.getLogPath(),
      port: config.port,
      host: config.host,
      statsClient: new JTStatsClient({
        category: config.category,
        port: config.statsPort,
        host: config.statsHost
      })
    });
  };

  JTCluster = require('jtcluster');

  options = {
    slaveTotal: 1,
    slaveHandler: start
  };

  jtCluster = new JTCluster(options);

  jtCluster.on('log', function(msg) {
    return console.dir(msg);
  });

}).call(this);
