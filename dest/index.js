(function() {
  var dgram, logger, server;

  dgram = require('dgram');

  server = dgram.createSocket('udp4');

  logger = require('./logger');

  module.exports.start = function(options) {
    var host, port;
    if (options == null) {
      options = {};
    }
    logger.setLogPath(options.logPath || '/vicanso/log/haproxy');
    if (options.statsClient) {
      logger.setStatsClient(options.statsClient);
    }
    server.on('listening', function() {
      var address;
      address = server.address();
      return console.dir("UDP server listening on " + address.address + ":" + address.port);
    });
    server.on('message', function(msg) {
      msg = msg.toString();
      return logger.log(msg);
    });
    port = options.port || 9200;
    host = options.host || '127.0.0.1';
    return server.bind(port, host);
  };

}).call(this);
