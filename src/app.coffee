
start = ->
  jtHalog = require './index'
  config = require './config'
  JTStatsClient = require 'jtstats_client'
  jtHalog.start {
    logPath : config.getLogPath()
    port : config.port
    host : config.host
    statsClient : new JTStatsClient {
      category : config.category
      port : config.statsPort
      host : config.statsHost
    }
  }

JTCluster = require 'jtcluster'
options = 
  slaveTotal : 1
  slaveHandler : start
jtCluster = new JTCluster options
jtCluster.on 'log', (msg) ->
  console.dir msg
