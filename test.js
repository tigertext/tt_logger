var tt_logger = require('./lib/tt_logger');
tt_logger.initLog("./trace.log", 5);
test1();

function test1() {
    tt_logger.logInfo("hello world");
    tt_logger.logWarn("test warn");
    tt_logger.logError("test error");
    tt_logger.logDebug("test debug");
}

