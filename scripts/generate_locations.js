var locationsPage = require('webpage').create(),
	feesPage = require('webpage').create(),
    _ = require('../libs/underscore'),
    helpers = require('../libs/helpers'),
	fs = require('fs'),
	system = require('system');

if (system.args.length < 1) {
	console.log('Missing OutputFile parameter!');
	phantom.exit(1);
} else {
	// prepare browser's tabs
    helpers.setupPage(locationsPage);
    helpers.setupPage(feesPage);
	
	locationsPage.open('http://www.craigslist.org/about/sites', function(status) {
		if (status !== 'success') {
		    helpers.wrongAddress();
		} else {
			    locationsPage.includeJs('libs/jquery.js', function() {

				//console.log(locationsPage.content); /* for debug */

				var json = locationsPage.evaluate(function() {
					var locations = [],
						region,
						area,
						loc;
					$('h1, .box > h4, .box li > a').each(function(i,el) {
						var $el = $(el);
						if(el.tagName == 'H1') {
								region = { name: $el.text(), areas: [] };
								locations.push(region);
						}
						if(el.tagName == 'H4') {
								area = { name: $el.text(), locations: [] };
								region.areas.push(area);
						}
						if(el.tagName == 'A') {
								loc = { name: $el.text(), href:el.href.toLowerCase(), isFree: true };
								area.locations.push(loc);
						}
					});
					return locations;
				});
				locationsPage.close();
				json = json.slice(0);
				
				feesPage.open('http://www.craigslist.org/about/help/posting_fees', function(status) {
					if (status !== 'success') {
						wrongAddress();
					} else {
						feesPage.includeJs('libs/jquery.js', function() {

							console.log(feesPage.content); /* for debug */

							var links = feesPage.evaluate(function() {
								var locations = [];
								$('a').each(function(i,el){
								    locations.push(el.href.toLowerCase());
								});
								return locations;
							});

                            // identifying paid locations
							//_.each(json, function(region) {
							//    _.each(region.areas, function (area) {
							//        _.each(area.locations, function(loc) {
							//            if (links.indexOf(loc.href) != -1) {
							//                loc.isFree = false;
							//            }
							//        });
						    //    });
						    //});
							for (var i = 0; i < json.length; i++) {
							    var region = json[i];
							    region.areas = region.areas.slice(0);
                                for (var j = 0; j < region.areas.length; j++) {
                                    var area = region.areas[j];
                                    area.locations = area.locations.slice(0);
                                    for (var k = 0; k < area.locations.length; k++) {
                                        var loc = area.locations[k];
                                        if (links.indexOf(loc.href) != -1) {
                                            loc.isFree = false;
                                        }
                                    }
                                }
							}

// building the page						
						    var compiledTemplate = _.template([
'<!DOCTYPE html>',
'<html>',
'<head>',
'<style>.paid{text-decoration: line-through;} .paid::after{content: " PAID!";color: red;}</style>',
'</head>',
'<body>',
'<% _.each(obj, function(region) { %>',
    '<div>',
    '<h1><%= region.name %></h1>',
    '<% _.each(region.areas, function(area) { %>',
    '<h2><%= area.name %></h2>',
        '<% _.each(area.locations, function(loc) { %>',
        '<ul>',
            '<li><a href="<%= loc.href%>" class="<%=(loc.isFree?\'\':\'paid\')%>"><%= loc.name %></a></li>',
        '</ul>',
        '<% }); %>',
    '<% }); %>',
    '</div>',
'<% }); %>',
'</body>',
'</html>'
                                ].join('')
                                );
						    var content = compiledTemplate(json);

							fs.write('results/locations.html', content, 'w');

							system.stdout.writeLine('--= THE TASK HAS BEEN COMPLETED SUCCESSFULLY! =--');
							feesPage.close();
							phantom.exit(0);
						});
					}
				});
			});
		}
    });
}
