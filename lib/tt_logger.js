var winston = require('winston');
var fs = require('fs'),
util = require('util'),
os = require('os');
var logLevel = 5;
var Schema = require('protobuf').Schema;
var dgram = require("dgram");
var schema = new Schema(fs.readFileSync(getPath(__filename) + 'popcorn.desc'));
// The "PopcornMsg" message.

var PopcornMsg = schema['popcornMsg.PopcornMsg'];

var Popcorn = function(options) {
  winston.Transport.call(this, options);
  this.name = 'popcon_transport';
  options = options || {};
  this.level = options.level || 'error';
  this.host = options.host || '127.0.0.1';
  this.port = options.port || 9125;
  this.node = os.hostname();
  this.node_role = "no_role";
  this.node_version = "no_version";
  var sock = dgram.createSocket("udp4");
  this.sock = sock;
};
util.inherits(Popcorn, winston.Transport);
winston.transports.Popcorn = Popcorn;
Popcorn.prototype.send = function(msg) {
  var buffer = new Buffer(msg);
  this.sock.send(buffer, 0, buffer.length, this.port, this.host);
};

Popcorn.prototype.log = function (level, msg, meta, callback) {
  //
  // Store this message and metadata, maybe use some custom logic
  // then callback indicating success.
  //
  Msg = {node: this.node, nodeRole: this.node_role, nodeVersion: this.node_version,
         level: get_popcorn_level(level), message: msg};
  if(meta && meta.module) Msg.module = meta.module;
  if(meta && meta.funcName) Msg.funcName = meta.funcName;
  if(meta && meta.line) Msg.line = meta.line;
  if(meta && meta.pid) Msg.pid = meta.pid;
  var raw = PopcornMsg.serialize(Msg);
  this.send(raw);
  callback(null, true);
};

function getPath(fileName) {
  var index = fileName.lastIndexOf('/');
  var path = fileName.substr(0, index+1);
  return path;
}

function get_popcorn_level(level) {
  if(level == "error") return 3;
  else if(level == "debug") return 7;
  else if(level == "warn") return 4;
  else return 6;
}

exports.initLog = function(name, logLevel_, popcornHost, popcornPort) {
  winston.add(winston.transports.File, { filename: name, maxsize: 5000000, maxFiles: 10});
  winston.add(winston.transports.Popcorn , {level: 'error', host: popcornHost, port: popcornPort});
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
  setTimeout(function() {process.exit(1);}, 2000); // exit with failure
});

