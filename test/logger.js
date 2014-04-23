(function() {
  var assert, fs, haproxyLog, jsc, logFilePath, logger, loggerPath, path, statsClientMock;

  assert = require('assert');

  jsc = require('jscoverage');

  path = require('path');

  fs = require('fs');

  loggerPath = '../dest/logger';

  haproxyLog = '<134>Apr 21 21:51:53 haproxy[1263]: 192.168.1.19:50525 [21/Apr/2014:21:51:36.180] 80port varnish/varnish9100 17646/0/0/0/17646 200 652 - - ---- 1/1/0/1/0 0/0 "GET /healthchecks HTTP/1.1"';

  statsClientMock = {
    gauge: function() {},
    count: function() {}
  };

  logFilePath = path.join(__dirname, '../log');

  if (process.env.NODE_ENV === 'cov') {
    logger = jsc.require(module, loggerPath);
  } else {
    logger = require(loggerPath);
  }

  describe('logger', function() {
    var stream, _createWriteStream;
    _createWriteStream = null;
    stream = {
      write: function() {}
    };
    before(function() {
      _createWriteStream = fs.createWriteStream;
      return fs.createWriteStream = function() {
        return stream;
      };
    });
    describe('#setLogPath, #getLogPath', function() {
      return it('should set and get log path successful', function() {
        logger.setLogPath(logFilePath);
        return assert.equal(logFilePath, logger.getLogPath());
      });
    });
    describe('#setStatsClient, #getStatsClient', function() {
      return it('should set and get stats client successful', function() {
        logger.setStatsClient(statsClientMock);
        return assert.equal(statsClientMock, logger.getStatsClient());
      });
    });
    describe('#setLogCacheTotal, #getLogCacheTotal', function() {
      return it('should set and get log cache total successful', function() {
        logger.setLogCacheTotal(1);
        return assert.equal(1, logger.getLogCacheTotal());
      });
    });
    describe('#addExtraHandler', function() {
      return it('should addExtraHandler successful', function(done) {
        var handler;
        handler = function(client, infos) {
          logger.removeExtraHandler(handler);
          if (infos.length === 12) {
            return done();
          } else {
            return done(new Error('the infos length is not equal 12'));
          }
        };
        logger.addExtraHandler(handler);
        return logger.log(haproxyLog);
      });
    });
    describe('#log successful', function() {
      return it('should log haproxy log successful', function(done) {
        var checkFinished, completed, countKeys, gaugeResult, total;
        completed = 0;
        total = 11;
        gaugeResult = {
          'time.TQ': 17646,
          'time.TW': 0,
          'time.TC': 0,
          'time.TR': 0,
          'time.TT': 17646,
          'connection.actconn': 1,
          'connection.feconn': 1,
          'connection.beconn': 0,
          'connection.srv_conn': 1
        };
        countKeys = ['statusCode.200', 'connection.retries'];
        checkFinished = function() {
          if (completed === total) {
            return done();
          }
        };
        logger.setStatsClient({
          gauge: function(key, value) {
            if (gaugeResult[key] === value) {
              completed++;
              return checkFinished();
            }
          },
          count: function(key) {
            if (~countKeys.indexOf(key)) {
              completed++;
              return checkFinished();
            }
          }
        });
        return logger.log(haproxyLog);
      });
    });
    return after(function() {
      return fs.createWriteStream = _createWriteStream;
    });
  });

}).call(this);
