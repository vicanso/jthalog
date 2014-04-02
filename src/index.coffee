config = require './config'
dgram = require 'dgram'
server = dgram.createSocket 'udp4'
logger = require './logger'

server.on 'listening', ->
  address = server.address()
  console.dir "UDP server listening on #{address.address}:#{address.port}"
server.on 'message', (msg) ->
  msg = msg.toString()
  logger.log msg


server.bind config.port, config.host
