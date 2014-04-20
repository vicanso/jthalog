dgram = require 'dgram'
server = dgram.createSocket 'udp4'
logger = require './logger'



module.exports.start = (options = {}) ->
  logger.setLogPath options.logPath || '/vicanso/log/haproxy'
  if options.statsClient
    logger.setStatsClient options.statsClient
  server.on 'listening', ->
    address = server.address()
    console.info "haproxy, UDP server listening on #{address.address}:#{address.port}"
  server.on 'message', (msg) ->
    msg = msg.toString()
    logger.log msg
  port = options.port || '9200'
  host = options.host || '127.0.0.1'
  server.bind port, host