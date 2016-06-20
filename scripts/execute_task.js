var _ = require('../libs/underscore'),
    helpers = require('../libs/helpers'),
    fs = require('fs'),
    system = require('system'),
    output = [],
    task,
    locIndex = 0,
	pathIndex = 0;

if (system.args.length < 1) {
    console.log('Missing OutputFile parameter!');
    phantom.exit(1);
} else {
    var taskFileName = system.args[1];
    var shuffle = system.args[2] == 'y' || system.args[2] == 'Y';
    var now = new Date();

    // read configuration file
    var taskFile = fs.read(taskFileName);
    task = JSON.parse(taskFile);

    if (shuffle) task.post.body = _.shuffle(task.post.body);

    // check if files exists
    _.each(task.post.images, function(path) {
        if (!fs.exists(path)) {
            console.log('| Some images do not exist or wrong path is set!!! Exiting now.\n');
            phantom.exit(1);
        }
    });

    // Start
    step1();
}

// STEP 1:
function step1() {
    var page = require('webpage').create();

    // prepare browser's tab
    helpers.setupPage(page);

    // STEP 1:
    page.open('https://accounts.craigslist.org/login', function(status) {
        if (status !== 'success') {
            helpers.wrongAddress();
        } else {
            page.onLoadFinished = function(status) {
                step2(page, task.locations[locIndex]);
            };

            page.evaluate(function(task) {
                document.querySelector('#inputEmailHandle').value = task.credentials.email;
                document.querySelector('#inputPassword').value = task.credentials.password;
                document.querySelector('[type=submit]').click();
            }, task);
            console.log('| Clicked Login button');
        }
    });
}

// STEP 2:
function step2(page, loc) {
    page.onLoadFinished = function () { };
    page.open(loc, function (status) {
        if (status !== 'success') {
            helpers.wrongAddress();
        } else {
            page.onLoadFinished = function (status) {
                step3(page);
            };
            page.evaluate(function () {
                //document.querySelector('#post').click();
                var a = document.getElementById("post");
                var e = document.createEvent('MouseEvents');
                e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            });
            console.log('| Clicked "Post to Classifieds"');
        }
    });
}

// STEP 3:
function step3(page) {
    page.onLoadFinished = function (status) {
		pathIndex++;
        if(pathIndex == task.path.length) step4(page);
		else step3(page);
    };
    if (page.injectJs('libs/jquery.js')) {
        page.evaluate(function (category) {
            var $el = $("label:contains('" + category + "') > input").eq(0);
            $el.prop('checked', true)
            $el.click();
			$('form').submit();
        }, task.path[pathIndex]);
    }
    console.log('| Selected "' + task.path[pathIndex] + '"');
}


// STEP 4:
function step4(page) {
    page.onLoadFinished = function (status) {
        step6(page)
    };
    var submitText;
    if (page.injectJs('libs/jquery.js')) {
        submitText = page.evaluate(function () {
            if ($(':submit').val() == "I will abide by these guidelines") {
                $(':submit').click();
            }
            return $(':submit').val();
        });
		if (submitText != "I will abide by these guidelines") step6(page);
		else console.log('| Accepted terms of agreement');
    }
}

// STEP 5:
/*
function step5(page) {
    page.onLoadFinished = function (status) {
        step6(page);
    };
    if (page.injectJs('libs/jquery.js')) {
        page.evaluate(function (task) {
            var $el = $("label:contains('" + task.category + "') > input").eq(0);
            $el.prop('checked', true)
            $el.click();
			$('form').submit();
        }, task);
    }
    console.log('| Selected "' + task.category + '"');
}
*/

// STEP 6:
function step6(page) {
    page.onLoadFinished = function (status) {
        step7(page);
    };
    if (page.injectJs('libs/jquery.js')) {
        page.evaluate(function (task) {
            var $el = $('[name=Privacy][value=P]').eq(0);
            $el.prop('checked', true)
            $el.click();

            $('#contact_phone_ok').click();
            $('#contact_text_ok').click();

            $('#contact_phone').val(task.post.phone);
            $('#contact_name').val(task.post.contactName);

            $('#PostingTitle').val(task.post.title);
            $('#GeographicArea').val(task.post.city + ', ' + task.post.state);
            $('#PostingBody').val(task.post.body.join('\n'));

            $('#remuneration').val(task.post.compensation);

            $('#wantamap').click();
            $('#xstreet0').val(task.post.street);
            $('#city').val(task.post.city);
            $('#region').val(task.post.state);

            $(':submit').click();
        }, task);
    }
    console.log('| Filled the post input boxes');
}

// STEP 7:
function step7(page) {
    page.onLoadFinished = function (status) {
        step8(page);
    };
    if (page.injectJs('libs/jquery.js')) {
        page.evaluate(function () {
            $('#curlat').val($('#geocoder_lat').val())
            $('#curlng').val($('#geocoder_lng').val())
            $(':submit').click();
        });
    }
    console.log('| Confirmed the address');
}

// STEP 8:
function step8(page) {
    page.onLoadFinished = function (status) {
        console.log('| Going to classic image uploader');
        step9(page);
    };

    page.evaluate(function () {
        var a = document.getElementById("classic");
        var e = document.createEvent('MouseEvents');
        e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    });
}

// STEP 9:
function step9(page) {
    page.onLoadFinished = function () { };

    if (task.post.images.length == 0) {
        step10(page);
        return;
    }

    var i = 0;
    function loader() {
        page.onLoadFinished = function (status) {
            if (i < task.post.images.length) {
                console.log('| Images uploaded:', i + '/' + task.post.images.length);
                loader();
            } else {
                console.log('| Images uploaded');
                step10(page);
            }
        }

        page.uploadFile('input[type=file]', task.post.images[i]);

        if (page.injectJs('libs/jquery.js')) {
            page.evaluate(function () {
                $(':file').mouseup();
                $(':file').change();
                //$(':submit').click();
            });
        }
        i++;
    }

    loader();
}

// STEP 10:
function step10(page) {
    page.onLoadFinished = function(status) {
        step11(page);
        helpers.takeScreenshot(page);
    };
    if (page.injectJs('libs/jquery.js')) {
        page.evaluate(function() {
            $(':submit').click();
        });
    }
    helpers.takeScreenshot(page);
    console.log('| Clicking "Done with images"');
}

// STEP 11:
function step11(page) {
    page.onLoadFinished = function (status) {
        locIndex++;
        console.log('| Link to post:', page.url);
        output.push(page.url);
        helpers.takeScreenshot(page);
        saveFile();
        if (task.locations.length == locIndex) {
            system.stdout.writeLine('--= THE TASK HAS BEEN COMPLETED SUCCESSFULLY! =--');
            phantom.exit(0);
        } else {
            phantom.clearCookies();
            step1();
        }
    };
    if (page.injectJs('libs/jquery.js')) {
        page.evaluate(function () {
            $(':submit[value=Continue]').eq(0).click();
        });
    }
    console.log('| Clicking "Publish"');
}

function saveFile() {
    // building the page						
    var compiledTemplate = _.template([
'<!DOCTYPE html>',
'<html>',
'<head>',
'</head>',
'<body>',
'<h1>Generated ads needed your verification:</h1>',
'<ul>',
    '<% _.each(obj, function(link) { %>',
    '<li><a href="<%= link%>"><%= link %></a></li>',
    '<% }); %>',
'</ul>',
'</body>',
'</html>'
    ].join('')
        );
    var content = compiledTemplate(output);

    fs.write('results/task_links_' + helpers.dateToJSONLocal(now) + '.html', content, 'w');
}