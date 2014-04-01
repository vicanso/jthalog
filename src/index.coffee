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


# <134>Mar 31 12:09:08 haproxy[2786]: 127.0.0.1:56113 [31/Mar/2014:12:09:08.121] 80port varnish/varnish9100 152/0/0/0/152 503 742 - - ---- 2/2/0/1/0 0/0 "GET /favicon.ico HTTP/1.1"\n'