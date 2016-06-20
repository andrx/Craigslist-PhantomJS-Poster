# Craigslist PhantomJS Poster

While cleaning my old laptop found the tool I wrote back in 2014 *(IT MIGHT NOT WORK NOW AS CRAIGSLIST CHANGES THE WORKFLOW FROM TIME TO TIME)*. Haven't used it since then but it worked well. Decided to push it to github. Maybe someone will find it useful when learning PhantomJS. It uses *jQuery* (to inject it into the page) and *underscore.js* (to generate results html file) libraries.

### Requirements

 * [PhantomJS v1.9+](http://phantomjs.org/download.html) In 2014 I used 1.9

### Usage

Configuration needed to run it is stored in *config.json*. You might need to change those if you need.

```js
{
    /* Same as: --ignore-ssl-errors=[true|false] ignores SSL errors, such as expired or self-signed certificate errors (default is false). Also accepted: [yes|no] */
    "ignoreSslErrors": false,

    /* Same as: --max-disk-cache-size=size limits the size of disk cache (in KB). */
    "maxDiskCacheSize": 10240,

    /* Same as: --output-encoding=utf8 */
    "outputEncoding": "utf8"
}
```

#### Craigslist Locations
First you need to generate the list of current available locations where you can post the ads.

```sh
phantomjs --config=config.json scripts\generate_locations.js
```

Generated file will be stored in *results* folder as *locations.html*. Here you need to grab links to your specific locations. You can also see Paid ones just in case. Page looks like this: 

![locations.png](https://dl.dropboxusercontent.com/u/25277569/CraigslistPhantomJsPoster/locations.png)

#### Tasks

Next you need to set up the tasks. They should be as well in JSON format.

You need to set your craigslist credentials, array of locations, category path, where to post the ad, ad's information (phone, name, title, address, body is an array of sentences, $, and images if needed):

```js
{
    "credentials": {
        "email": "cra.petia@gmail.com",
        "password": "mko0Pass"
    },
    "locations": [
        "http://anchorage.craigslist.org/",
        "http://fairbanks.craigslist.org/"
    ],
	"path": ["job offered", "transportation"],
    "post": {
        "phone": "+630-000-0000",
        "contactName": "Tony",
        "title": "OTR CDL Class A Truck Driver",
        "city": "Chicago",
        "state": "IL",
        "street": "",
        "body": [
            "We are a small company based out of Chicago, IL and growing daily.\n",
            "If you want to earn money and enjoy driving this is the right fit for you.\n",
            "We run 50 states\n",
            "Safety is our number one priority!!\n",
            "So if you want to make great money and have no worries give us a call\n"
        ],
        "compensation": "1000$",
        "images": [ "D:\\MyProjects\\js-automation\\images\\1.png", 
                    "D:\\MyProjects\\js-automation\\images\\2.jpg"
        ]
    }
}
```

To execute the posting script, run:
```sh
phantomjs --config=config.json scripts\execute_task.js task.json "n"
```

if the last parameter equals to **"y"** then script will shuffle sentences in the body of the ad.

#### Step 6

*Step 6* in the code needs your attention. This section currently is hardcoded. It would be cool to make it generic. For example, go over through all of the properties inside *task.post* and set inputs' values.

```js
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
```

The script will screenshot the last steps before posting it and will put them in *screens* folder. The links to the posts will be saved in generated *results/task_links.html* file. 