path = require 'path'
fs = require 'fs'

logCacheTotal = 20
logPath = null
logFileName = null
logFileWriteStream = null
statsClient = null
msgList = []


###*
 * [setLogPath 设置log的目录]
 * @param {[type]} filePath [description]
###
module.exports.setLogPath = (filePath) ->
  logPath = filePath
  return

###*
 * [setStatsClient 设置stats client]
 * @param {[type]} client [description]
###
module.exports.setStatsClient = (client) ->
  statsClient = client
  return

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
      timing infos[4]
      statusCodeCounter infos[5]
      connectionTotalLog infos[10]
###*
 * [timing 记录TQ, TW, TC, TR, TT]
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
###
timing = (info)  ->
  return if !info
  tags = ['TQ', 'TW', 'TC', 'TR', 'TT']
  for time in info.split '/'
    time = GLOBAL.parseInt time
    key = "time.#{tags[i]}"
    statsClient.gauge key, time

###*
 * [statusCodeCounter 记录http status code]
 * @param  {[type]} code [description]
 * @return {[type]} [description]
###
statusCodeCounter = (code) ->
  return if !code
  key = "statusCode.#{code}"
  statsClient.count key

###*
 * [connectionTotalLog 统计连接数, actconn/feconn/beconn/srv_conn/retries]
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
###
connectionTotalLog = (info) ->
  return if !info
  tags = ['actconn', 'feconn', 'beconn', 'srv_conn', 'retries']
  for total, i in info.split '/'
    total = GLOBAL.parseInt total
    tag = tags[i]
    key = "connection.#{tag}"
    if tag == 'retries'
      statsClient.count key, total
    else
      statsClient.gauge key, total

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
  month = date.getMonth()
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
