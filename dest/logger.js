(function() {
  var connectionTotalLog, createLogFileWriteStream, fs, getLogFile, haproxyStatistics, logCacheTotal, logFileName, logFileWriteStream, logPath, msgList, path, statsClient, statusCodeCounter, timing;

  path = require('path');

  fs = require('fs');

  logCacheTotal = 20;

  logPath = null;

  logFileName = null;

  logFileWriteStream = null;

  statsClient = null;

  msgList = [];


  /**
   * [setLogPath 设置log的目录]
   * @param {[type]} filePath [description]
   */

  module.exports.setLogPath = function(filePath) {
    logPath = filePath;
  };


  /**
   * [setStatsClient 设置stats client]
   * @param {[type]} client [description]
   */

  module.exports.setStatsClient = function(client) {
    statsClient = client;
  };


  /**
   * [log log文件]
   * @param  {[type]} msg [description]
   * @return {[type]}     [description]
   */

  module.exports.log = function(msg) {
    msgList.push(msg);
    haproxyStatistics(msg);
    if (msgList.length === logCacheTotal) {
      if (!logFileWriteStream) {
        logFileWriteStream = createLogFileWriteStream();
      }
      logFileWriteStream.write(msgList.join(''));
      msgList = [];
    }
  };


  /**
   * [haproxyStatistics 统计haproxy]
   * @param  {[type]} msg [description]
   * @return {[type]}     [description]
   */

  haproxyStatistics = function(msg) {
    var index, infos, re, requestUrl, result, urlIndex;
    msg = msg.trim();
    re = /haproxy\[\d*\]\: /;
    result = re.exec(msg);
    index = result != null ? result.index : void 0;
    if (index && result[0]) {
      msg = msg.substring(index + result[0].length);
      urlIndex = msg.indexOf('"');
      requestUrl = msg.substring(urlIndex);
      requestUrl = requestUrl.substring(1, requestUrl.length - 1);
      infos = msg.substring(0, urlIndex - 1).split(' ');
      if ((infos != null ? infos.length : void 0) === 12 && statsClient) {
        timing(infos[4]);
        statusCodeCounter(infos[5]);
        return connectionTotalLog(infos[10]);
      }
    }
  };


  /**
   * [timing 记录TQ, TW, TC, TR, TT]
   * @param  {[type]} info [description]
   * @return {[type]}      [description]
   */

  timing = function(info) {
    var key, tags, time, _i, _len, _ref, _results;
    if (!info) {
      return;
    }
    tags = ['TQ', 'TW', 'TC', 'TR', 'TT'];
    _ref = info.split('/');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      time = _ref[_i];
      time = GLOBAL.parseInt(time);
      key = "time." + tags[i];
      _results.push(statsClient.gauge(key, time));
    }
    return _results;
  };


  /**
   * [statusCodeCounter 记录http status code]
   * @param  {[type]} code [description]
   * @return {[type]} [description]
   */

  statusCodeCounter = function(code) {
    var key;
    if (!code) {
      return;
    }
    key = "statusCode." + code;
    return statsClient.count(key);
  };


  /**
   * [connectionTotalLog 统计连接数, actconn/feconn/beconn/srv_conn/retries]
   * @param  {[type]} info [description]
   * @return {[type]}      [description]
   */

  connectionTotalLog = function(info) {
    var i, key, tag, tags, total, _i, _len, _ref, _results;
    if (!info) {
      return;
    }
    tags = ['actconn', 'feconn', 'beconn', 'srv_conn', 'retries'];
    _ref = info.split('/');
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      total = _ref[i];
      total = GLOBAL.parseInt(total);
      tag = tags[i];
      key = "connection." + tag;
      if (tag === 'retries') {
        _results.push(statsClient.count(key, total));
      } else {
        _results.push(statsClient.gauge(key, total));
      }
    }
    return _results;
  };


  /**
   * [createLogFileWriteStream 创建写log的写入流]
   * @return {[type]} [description]
   */

  createLogFileWriteStream = function() {
    var file, options;
    if (logFileWriteStream) {
      logFileWriteStream.end();
    }
    logFileName = getLogFile();
    file = path.join(logPath, logFileName);
    options = {
      flags: 'a+'
    };
    return fs.createWriteStream(file, options);
  };

  getLogFile = function() {
    var date, day, month, str;
    date = new Date();
    str = date.getFullYear();
    month = date.getMonth() + 1;
    str += '-';
    if (month < 10) {
      str += "0" + month;
    } else {
      str += month;
    }
    day = date.getDate();
    str += '-';
    if (day < 10) {
      str += "0" + day;
    } else {
      str += day;
    }
    return "" + str + ".log";
  };

  setInterval(function() {
    var tmpFile;
    tmpFile = getLogFile();
    if (tmpFile !== logFileName) {
      logFileWriteStream = createLogFileWriteStream();
    }
  }, 300 * 1000);

}).call(this);
