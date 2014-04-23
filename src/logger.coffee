path = require 'path'
fs = require 'fs'

logCacheTotal = 20
logPath = null
logFileName = null
logFileWriteStream = null
statsClient = null
extraHandlerList = []
msgList = []


###*
 * [setLogPath 设置log的目录]
 * @param {[type]} filePath [description]
###
module.exports.setLogPath = (filePath) ->
  logPath = filePath
  return

###*
 * [getLogPath 获取log path]
 * @return {[type]} [description]
###
module.exports.getLogPath = ->
  logPath

###*
 * [setStatsClient 设置stats client]
 * @param {[type]} client [description]
###
module.exports.setStatsClient = (client) ->
  statsClient = client
  return
###*
 * [getStatsClient 获取stats client]
 * @return {[type]} [description]
###
module.exports.getStatsClient = ->
  statsClient

###*
 * [setLogCacheTotal 设置cache的log数量（避免频繁写硬盘）]
###
module.exports.setLogCacheTotal = (total) ->
  logCacheTotal = total if total
  return
###*
 * [getLogCacheTotal 获取设置cache的log数量]
 * @return {[type]} [description]
###
module.exports.getLogCacheTotal = ->
  logCacheTotal

###*
 * [log log文件]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
###
module.exports.log = (msg) ->
  msgList.push msg
  haproxyStatistics msg
  if msgList.length == logCacheTotal
    logFileWriteStream = createLogFileWriteStream() if !logFileWriteStream
    logFileWriteStream.write msgList.join('')
    msgList = []
  return
###*
 * [addExtraHandler description]
 * @param {[type]} handler [description]
###
module.exports.addExtraHandler = (handler) ->
  extraHandlerList.push handler

###*
 * [removeExtraHandler description]
 * @param  {[type]} handler [description]
 * @return {[type]}         [description]
###
module.exports.removeExtraHandler = (handler) ->
  for tmp, i in extraHandlerList
    if tmp == handler
      extraHandlerList.splice i, 1
      break
  return

###*
 * [haproxyStatistics 统计haproxy]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
###
haproxyStatistics = (msg) ->
  msg = msg.trim()
  re = /haproxy\[\d*\]\: /
  result = re.exec msg
  index = result?.index
  if index && result[0]
    msg = msg.substring index + result[0].length
    urlIndex = msg.indexOf '"'
    requestUrl = msg.substring urlIndex
    requestUrl = requestUrl.substring 1, requestUrl.length - 1
    infos = msg.substring(0, urlIndex - 1).split ' '
    if infos?.length == 12 && statsClient
      timing statsClient, infos[4]
      statusCodeCounter statsClient, infos[5]
      connectionTotalLog statsClient, infos[10]
      if extraHandlerList.length
        handler statsClient, infos for handler in extraHandlerList
  return
###*
 * [timing 记录TQ, TW, TC, TR, TT]
 * @param  {[type]} client stats client
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
###
timing = (client, info)  ->
  return if !info
  tags = ['TQ', 'TW', 'TC', 'TR', 'TT']
  for time, i in info.split '/'
    time = GLOBAL.parseInt time
    key = "time.#{tags[i]}"
    client.gauge key, time

###*
 * [statusCodeCounter 记录http status code]
 * @param  {[type]} client stats client
 * @param  {[type]} code [description]
 * @return {[type]} [description]
###
statusCodeCounter = (client, code) ->
  return if !code
  key = "statusCode.#{code}"
  client.count key

###*
 * [connectionTotalLog 统计连接数, actconn/feconn/beconn/srv_conn/retries]
 * @param  {[type]} client stats client
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
###
connectionTotalLog = (client, info) ->
  return if !info
  tags = ['actconn', 'feconn', 'beconn', 'srv_conn', 'retries']
  for total, i in info.split '/'
    total = GLOBAL.parseInt total
    tag = tags[i]
    key = "connection.#{tag}"
    if tag == 'retries'
      client.count key, total
    else
      client.gauge key, total

###*
 * [createLogFileWriteStream 创建写log的写入流]
 * @return {[type]} [description]
###
createLogFileWriteStream = ->
  logFileWriteStream.end() if logFileWriteStream
  logFileName = getLogFile()
  file = path.join logPath, logFileName
  options =
    flags : 'a+'
  fs.createWriteStream file, options

getLogFile = ->
  date = new Date()
  str = date.getFullYear()
  month = date.getMonth() + 1
  str += '-'
  if month < 10
    str += "0#{month}"
  else
    str += month
  day = date.getDate()
  str += '-'
  if day < 10
    str += "0#{day}"
  else
    str += day
  "#{str}.log"


# 定时去判断当前时间是否已过24时，用于每日生成一个log文件
setInterval ->
  tmpFile = getLogFile()
  if tmpFile != logFileName
    logFileWriteStream = createLogFileWriteStream()
    return
, 300 * 1000
