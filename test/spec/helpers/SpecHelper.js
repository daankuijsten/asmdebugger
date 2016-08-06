var Test = Test || {};

Test = function() {

    var consoleLogMessages = [];

    function logConsoleLog() {
        var oldLog = console.log;
        console.log = function (message) {
            consoleLogMessages.push(message);
            oldLog.apply(console, arguments);
        };
    }

    function getConsoleLog(number) {
        return consoleLogMessages.slice(-1 * number)[0]
    }

    function getError() {
        return getConsoleLog(2);
    }

    function code(code) {
        var oldText = $('.code').text();
        $('.code').text(oldText + code + "\n");
        $('.code').keyup();
    }

    function next(times) {
        times = times || 1;

        for (var i=0; i<times; i++) {
            $('.next').click();
        }
    }

    function reg(regValueType) {
        regValueType = regValueType.split('.');
        if (regValueType.length !== 2) {
            console.log('Test.reg needs a dot "." in the middle');
            return false;
        }

        var reg = regValueType[0];
        var valueType = regValueType[1];

        return $('.' + reg + '.' + valueType).text().trim();
    }

    function clear() {
        $('.code').text('');
    }

    function selectedLineAddress() {
        return $('.code span.active').data('address');
    }

    return {
          code: code,
          next: next,
          reg: reg,
          getConsoleLog: getConsoleLog,
          logConsoleLog: logConsoleLog,
          clear: clear,
          getError: getError,
          selectedLineAddress
    }
}();

// Start the console.log
Test.logConsoleLog();
