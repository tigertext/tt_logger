var winston = require('winston');
require('winston-popcorn').Popcorn;
var logLevel = 5;
var popcornHost = '127.0.0.1';
var popcornPort = 9125;

exports.initLog = function(name, logLevel_) {
  winston.add(winston.transports.File, { filename: name, maxsize: 5000000, maxFiles: 10});
  winston.add(winston.transports.Popcorn, {level: 'info', host: popcornHost, port: popcornPort});
  winston.remove(winston.transports.Console);
  logLevel = logLevel_;
}
exports.logInfo = function(log) {
  if(logLevel >= 4) {
    var meta = get_meta();
    winston.log('info', log, meta); 
  }
}

exports.logDebug = function(log) {
  if(logLevel >=5) {
    var meta = get_meta();
    winston.log('debug', log, meta);
  }
}

exports.logWarn = function(log) {
  if(logLevel >= 3) {
    var meta = get_meta();
    winston.log('warn', log, meta);
  }
}

exports.logError = function(log, Meta) {
  if(logLevel >= 2) {
    if(Meta) winston.log('error', log, Meta);
    else {
      var meta = get_meta();
      winston.log('error', log, meta);
    }
  }
}

function get_meta() {
  var data ={};
  data.method = data.path = data.line = data.pos = data.file = '';
  data.stack = (new Error()).stack.split('\n').slice(3);
  // Stack trace format :
  // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
  var s = data.stack[0], sp = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi.exec(s)
      || /at\s+()(.*):(\d*):(\d*)/gi.exec(s);
  if (sp && sp.length === 5) {
    data.method = sp[1];
    data.path = sp[2];
    data.line = sp[3];
    data.pos = sp[4];
    var paths = data.path.split('/');
    data.file = paths[paths.length - 1];
  }
  var meta = {pid: process.pid, module: data.file,
                funcName: data.method, line: data.line};
  return meta;
}

process.on('uncaughtException', function (err) {
  exports.logError('uncaughtException, err msg:' + err.message + ' stack:' + err.stack,
                  {pid: process.pid, module: 'tt_logger', funcName: 'uncaughtException', line: 64});
  process.exit(1); // exit with failure
});

