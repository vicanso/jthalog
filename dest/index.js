(function() {
  var config, dgram, logger, server;

  config = require('./config');

  dgram = require('dgram');

  server = dgram.createSocket('udp4');

  logger = require('./logger');

  server.on('listening', function() {
    var address;
    address = server.address();
    return console.dir("UDP server listening on " + address.address + ":" + address.port);
  });

  server.on('message', function(msg) {
    msg = msg.toString();
    return logger.log(msg);
  });

  server.bind(config.port, config.host);

}).call(this);
