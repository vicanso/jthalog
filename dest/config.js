(function() {
  var program;

  program = require('commander');

  (function() {
    return program.version('0.0.1').option('-p, --port <n>', 'listen port', parseInt).option('--host <n>', 'listen host').option('--category <n>', 'stats category').option('--statsHost <n>', 'stats host').option('--statsPort <n>', 'stats port').option('--log <n>', 'the log file path').parse(process.argv);
  })();

  module.exports.category = program.category || '';

  module.exports.statsPort = program.statsPort;

  module.exports.statsHost = program.statsHost;

  module.exports.port = program.port || 9200;

  module.exports.host = program.host || '127.0.0.1';

  module.exports.getLogPath = function() {
    return program.log || '/vicanso/log/haproxy';
  };

}).call(this);
