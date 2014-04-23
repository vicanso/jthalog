assert = require 'assert'
jsc = require 'jscoverage'
path = require 'path'
fs = require 'fs'
loggerPath = '../dest/logger'
haproxyLog = '<134>Apr 21 21:51:53 haproxy[1263]: 192.168.1.19:50525 [21/Apr/2014:21:51:36.180] 80port varnish/varnish9100 17646/0/0/0/17646 200 652 - - ---- 1/1/0/1/0 0/0 "GET /healthchecks HTTP/1.1"'

statsClientMock = 
  gauge : ->
  count : ->
logFilePath = path.join __dirname, '../log'


if process.env.NODE_ENV == 'cov'
  logger = jsc.require module, loggerPath
else
  logger = require loggerPath

describe 'logger', ->
  _createWriteStream = null
  stream = 
    write : ->
  before ->
    _createWriteStream = fs.createWriteStream
    fs.createWriteStream = ->
      stream

  describe '#setLogPath, #getLogPath', ->
    it 'should set and get log path successful', ->
      logger.setLogPath logFilePath
      assert.equal logFilePath, logger.getLogPath()

  describe '#setStatsClient, #getStatsClient', ->
    it 'should set and get stats client successful', ->
      logger.setStatsClient statsClientMock
      assert.equal statsClientMock, logger.getStatsClient()
  describe '#setLogCacheTotal, #getLogCacheTotal', ->
    it 'should set and get log cache total successful', ->
      logger.setLogCacheTotal 1
      assert.equal 1, logger.getLogCacheTotal()

  describe '#addExtraHandler', ->
    it 'should addExtraHandler successful', (done) ->
      handler = (client, infos) ->
        logger.removeExtraHandler handler
        if infos.length == 12
          done()
        else
          done new Error 'the infos length is not equal 12'
      logger.addExtraHandler handler
      logger.log haproxyLog

  describe '#log successful', ->
    it 'should log haproxy log successful', (done) ->
      completed = 0
      total = 11
      gaugeResult = 
        'time.TQ' : 17646
        'time.TW' : 0
        'time.TC' : 0
        'time.TR' : 0
        'time.TT' : 17646
        'connection.actconn' : 1
        'connection.feconn' : 1
        'connection.beconn' : 0
        'connection.srv_conn' : 1
      countKeys = ['statusCode.200', 'connection.retries']
      checkFinished = ->
        done() if completed == total
      logger.setStatsClient {
        gauge : (key, value) ->
          if gaugeResult[key] == value
            completed++
            checkFinished()
        count : (key) ->
          if ~countKeys.indexOf key
            completed++
            checkFinished()
      }
      logger.log haproxyLog

  after ->
    fs.createWriteStream = _createWriteStream