var winston = require('winston');
var fs = require('fs'),
util = require('util'),
os = require('os');
var logLevel = 5;

function getPath(fileName) {
  var index = fileName.lastIndexOf('/');
  var path = fileName.substr(0, index+1);
  return path;
}
/*
129 lager_severity_to_mask(debug)     -> 128;
130 lager_severity_to_mask(info)      -> 64;
131 lager_severity_to_mask(notice)    -> 32;
132 lager_severity_to_mask(warn)      -> 16;
133 lager_severity_to_mask(error)     -> 8;
134 lager_severity_to_mask(critical)  -> 4;
135 lager_severity_to_mask(alert)     -> 2;
136 lager_severity_to_mask(emergency) -> 1;
137 lager_severity_to_mask(none)      -> 0.
*/

exports.initLog = function(name, logLevel_, popcornHost, popcornPort, nodeRole, nodeVersion) {
  var serviceName = module.parent.filename;
  var index = serviceName.lastIndexOf('/');
  if(index > 0) {
    serviceName = serviceName.slice(0, index);
    var p = serviceName.lastIndexOf('/')
    if(p > 0) serviceName = serviceName.slice(p+1);
  }
  winston.add(winston.transports.File, { filename: name, maxsize: 5000000, maxFiles: 10, level: 'debug'});
  winston.remove(winston.transports.Console);
  logLevel = logLevel_;
}
exports.logInfo = function(log) {
  if(logLevel >= 4) {
    var current = new Date();
    var meta = get_meta();
    winston.log('info', current + '  ' + log, meta);
  }
}

exports.logDebug = function(log) {
  if(logLevel >=5) {
    var current = new Date();
    var meta = get_meta();
    winston.log('debug', current + '  ' + log, meta);
  }
}

exports.logWarn = function(log) {
  if(logLevel >= 3) {
    var current = new Date();
    var meta = get_meta();
    winston.log('warn', current + '  ' + log, meta);
  }
}

exports.logError = function(log, Meta) {
  if(logLevel >= 2) {
    var current = new Date();
    if(Meta) winston.log('error', current + '  ' + log, Meta);
    else {
      var meta = get_meta();
      winston.log('error', current + '  ' + log, meta);
    }
  }
}

function get_meta() {
  var data ={};
  data.path = data.line = data.pos = data.file = '';
  data.method = "main";
  data.stack = (new Error()).stack.split('\n').slice(3);
  // Stack trace format :
  // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
  var s = data.stack[0], sp = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi.exec(s)
      || /at\s+()(.*):(\d*):(\d*)/gi.exec(s);
  if (sp && sp.length === 5) {
    if(sp[1]) data.method = sp[1];
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
  setTimeout(function() {process.exit(1);}, 2000); // exit with failure
});
