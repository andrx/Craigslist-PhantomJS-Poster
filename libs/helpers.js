function setupPage(page) {
    // Emulating Chrome browser 
    page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0';

    // adding listeners
    page.onConsoleMessage = function (msg, lineNum, sourceId) {
        console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };

    page.resources = [];
    page.onResourceRequested = function (req) {
        page.resources[req.id] = {
            request: req,
            startReply: null,
            endReply: null
        };
    };

    page.onResourceReceived = function (res) {
        if (res.stage === 'start') {
            page.resources[res.id].startReply = res;
        }
        if (res.stage === 'end') {
            page.resources[res.id].endReply = res;
        }
    };

    page.onError = function (msg, trace) {
        var msgStack = ['ERROR: ' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function (t) {
                //msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function+'")' : ''));
            });
        }
        system.stderr.writeLine(msgStack.join('\n'));
        // don't exit, just log errors
        //phantom.exit(1);
    };

    page.onResourceError = function (resourceError) {
        var status = 'undefined';
        var statusText = '';

        system.stderr.writeLine('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
        system.stderr.writeLine('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);

        page.resources.forEach(function (resource) {
            var request = resource.request,
				endReply = resource.endReply;

            if (request && request.url === resourceError.url && !endReply) {
                system.stderr.writeLine('request id was :' + request.id);
                var response = endReply != null ? endReply : (resource.startReply != null ? resource.startReply : {
                    status: 'No Data',
                    statusText: 'No Data'
                });
                status = response.status;
                statusText = response.statusText;
            }
        });
        system.stderr.writeLine('Status code: ' + status + '. StatusText: ' + statusText);
    };
}

function wrongAddress() {
    system.stdout.writeLine(404);
    console.log('Unable to load the address!');
    system.stderr.writeLine('ERROR: Unable to load the address!');
    phantom.exit(404);
}

function takeScreenshot(page) {
    page.render('screens/' + dateToJSONLocal(new Date()) + '.png', {
        format: 'png',
        quality: '100'
    });
}

function dateToJSONLocal(date) {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON().replace('Z', '').replace(/[T:.]/g, '-');
}

exports.setupPage = setupPage;
exports.wrongAddress = wrongAddress;
exports.takeScreenshot = takeScreenshot;
exports.dateToJSONLocal = dateToJSONLocal;