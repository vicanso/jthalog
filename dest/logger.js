(function() {
  var connectionTotalLog, createLogFileWriteStream, dataSizeLog, extraHandlerList, fs, getLogFile, haproxyMsgList, haproxyStatistics, largeSize, logCacheTotal, logFileName, logFileWriteStream, logPath, mediumSize, mkdirp, path, requestCountLog, smallSize, statsClient, statusCodeCounter, timing, xsmallSize;

  path = require('path');

  fs = require('fs');

  mkdirp = require('mkdirp');

  logCacheTotal = 20;

  logPath = null;

  logFileName = null;

  logFileWriteStream = null;

  statsClient = null;

  extraHandlerList = [];

  haproxyMsgList = [];


  /**
   * [setLogPath 设置log的目录]
   * @param {[type]} filePath [description]
   */

  module.exports.setLogPath = function(filePath) {
    logPath = filePath;
  };


  /**
   * [getLogPath 获取log path]
   * @return {[type]} [description]
   */

  module.exports.getLogPath = function() {
    return logPath;
  };


  /**
   * [setStatsClient 设置stats client]
   * @param {[type]} client [description]
   */

  module.exports.setStatsClient = function(client) {
    statsClient = client;
  };


  /**
   * [getStatsClient 获取stats client]
   * @return {[type]} [description]
   */

  module.exports.getStatsClient = function() {
    return statsClient;
  };


  /**
   * [log log文件]
   * @param  {[type]} msg [description]
   * @return {[type]}     [description]
   */

  module.exports.log = function(msg) {
    haproxyMsgList.push(msg);
    haproxyStatistics(msg);
  };


  /**
   * [addExtraHandler description]
   * @param {[type]} handler [description]
   */

  module.exports.addExtraHandler = function(handler) {
    return extraHandlerList.push(handler);
  };


  /**
   * [removeExtraHandler description]
   * @param  {[type]} handler [description]
   * @return {[type]}         [description]
   */

  module.exports.removeExtraHandler = function(handler) {
    var i, tmp, _i, _len;
    for (i = _i = 0, _len = extraHandlerList.length; _i < _len; i = ++_i) {
      tmp = extraHandlerList[i];
      if (tmp === handler) {
        extraHandlerList.splice(i, 1);
        break;
      }
    }
  };


  /**
   * [haproxyStatistics 统计haproxy]
   * @param  {[type]} msg [description]
   * @return {[type]}     [description]
   */

  haproxyStatistics = function(msg) {
    var handler, index, infos, re, requestUrl, result, urlIndex, _i, _len;
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
        timing(statsClient, infos[4]);
        statusCodeCounter(statsClient, infos[5]);
        connectionTotalLog(statsClient, infos[10]);
        dataSizeLog(statsClient, infos[6]);
        requestCountLog(statsClient);
        if (extraHandlerList.length) {
          for (_i = 0, _len = extraHandlerList.length; _i < _len; _i++) {
            handler = extraHandlerList[_i];
            handler(statsClient, infos);
          }
        }
      }
    }
  };


  /**
   * [timing 记录TQ, TW, TC, TR, TT]
   * @param  {[type]} client stats client
   * @param  {[type]} info [description]
   * @return {[type]}      [description]
   */

  timing = function(client, info) {
    var i, key, tags, time, _i, _len, _ref, _results;
    if (!info) {
      return;
    }
    tags = ['TQ', 'TW', 'TC', 'TR', 'TT'];
    _ref = info.split('/');
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      time = _ref[i];
      time = GLOBAL.parseInt(time);
      key = "time." + tags[i];
      _results.push(client.gauge(key, time));
    }
    return _results;
  };


  /**
   * [statusCodeCounter 记录http status code]
   * @param  {[type]} client stats client
   * @param  {[type]} code [description]
   * @return {[type]} [description]
   */

  statusCodeCounter = function(client, code) {
    var key;
    if (!code) {
      return;
    }
    key = "statusCode." + code;
    return client.count(key);
  };

  xsmallSize = 2 * 1024;

  smallSize = 15 * 1024;

  mediumSize = 30 * 1024;

  largeSize = 60 * 1024;


  /**
   * [dataSizeLog 记录数据量的分级，共分5个级别]
   * @param  {[type]} client [description]
   * @param  {[type]} size   [description]
   * @return {[type]}        [description]
   */

  dataSizeLog = function(client, size) {
    var type;
    if (size < xsmallSize) {
      type = 'xs';
    } else if (size < smallSize) {
      type = 's';
    } else if (size < mediumSize) {
      type = 'm';
    } else if (size < largeSize) {
      type = 'l';
    } else {
      type = 'xl';
    }
    return client.gauge("size." + type);
  };

  requestCountLog = function(client) {
    return client.count('reqTotal');
  };


  /**
   * [connectionTotalLog 统计连接数, actconn/feconn/beconn/srv_conn/retries]
   * @param  {[type]} client stats client
   * @param  {[type]} info [description]
   * @return {[type]}      [description]
   */

  connectionTotalLog = function(client, info) {
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
        _results.push(client.count(key, total));
      } else {
        _results.push(client.gauge(key, total));
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
    mkdirp.sync(logPath);
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
    if (!logFileWriteStream) {
      logFileWriteStream = createLogFileWriteStream();
    }
    logFileWriteStream.write(haproxyMsgList.join(''));
    haproxyMsgList = [];
  }, 30 * 1000);

  setInterval(function() {
    var tmpFile;
    tmpFile = getLogFile();
    if (tmpFile !== logFileName) {
      logFileWriteStream = createLogFileWriteStream();
    }
  }, 300 * 1000);

}).call(this);
