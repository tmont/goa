# Goa

[![Build Status](https://travis-ci.org/tmont/goa.png)](https://travis-ci.org/tmont/goa)

Goa is a very small, very simple MVCish framework for Node. I say
"MVCish" because it's built on top of [Express](http://expressjs.com/)
which already handles views. So it's more like an "MC" framework.
Except it doesn't do much with models, either. Whatever. It does
SOMETHING, I'm sure of it.

If you've used ASP.NET MVC at all, some of the idioms may look familiar.
Specifically, the way route parameters and action results are architected
should look very similar.

## Installation
Install via [NPM](https://github.com/isaacs/npm): `npm install goa`

## Usage
Goa sits on top of Express. It's Express all the way down. Except for the top.
Which is Goa.

### Do the thing
Inside your sweet app, wherever you're initializing Express, do this:

```javascript
var express = require('express'),
	goa = require('goa'),
	expressApp = express(),
	app = goa(expressApp, {
		//more on this in a minute
		controllerFactory: function(name, params) {
			return {
				index: function(params, callback) {
					callback(goa.action('yay!'));
				}
			};
		}
	});
```

That will get your new Goa application up and running.

### Adding routes and stuff
Routing is, literally, the same as Express. Because it delegates to the
default Express routing. So literally any route you were using in your
Express app you can use with Goa. Literally.

The only difference is that it does not use a route handler in the form
of `function(req, res, next)`. Instead, in its place, you specify the
controller and action that you want to execute.

```javascript
//the "action" is optional, and defaults to "index" if not given
app.get('/awesome', { controller: 'foo', action: 'bar' });
```

### Controllers and factories
So you need a controller. This *IS* an MC after all.

A controller factory creates controllers. A controller factory is a function
that takes two arguments: the name of the controller to create (dictated
from your route handler up there) and a context, which contains stuff
that might be useful (specifically, the `req`, `res` and `next`).

The properties on your controller correspond to actions. So if your
route handler looks like this: `{ controller: 'foo', action: 'bar' }`,
then your `foo` controller better look like this:

```javascript
{
	bar: function(params, callback) {
		// do stuff
	}
}
```

You can set up your controller factory however you want. Here's a sample one:

```javascript
function(name, context) {
	//"foo" => "FooController"
	var className = name.charAt(0).toUpperCase() + name.substring(1) + 'Controller';

	//assuming the file name is "controllers/FooController.js"
	var Controller = require('./controllers/' + className);
	return new Controller(context);
}
```

### Action methods
Action methods are properties on controllers, like the "bar" thing we did up
above. They should always return some kind of `Result` object. There are six
built-in `Result` objects:

1. `ActionResult(content[, contentType])` - simply sends whatever content you give it
	* `goa.action('foo bar', 'text/plain');`
2. `JsonResult(json)` - sends JSON
	* `goa.json({ foo: 'bar' });`
3. `FileResult(file[, options])` - sends a file (uses `res.sendfile()` and `res.download()`)
	* `goa.file('/path/to/file');`
	* `goa.file('/path/to/file', { maxAge: 60000 });`
	* `goa.file('/path/to/file', { fileName: 'foo.txt' });` - sets `Content-Disposition` header
4. `ViewResult(view[, params])` - renders a view with optional params
	* `goa.view('index.jade', { message: 'Welcome!' });`
5. `ErrorResult(error[, statusCode = 500])` - delegates to Express's error handler
	* `goa.error(new Error('Verboten!'), 403);`
6. `RedirectResult(location[, statusCode = 302])` - redirects to `location`
	* `goa.redirect('/foo');`

All result objects should have an `execute(res, next)` function, if you decide to
implement your own.

The preferred way of using the built-in result objects is via their factory
functions on the `goa` object, e.g. `goa.view('myview')`. But, if you like
typing, you can also access their constructors directly off of the
`goa.results` object: `new goa.results.ViewResult('myview')`.

Action methods are passed a `params` object, which is a conglomeration of `req.params`
and `req.body`. If you need access to the raw request, you should make sure and inject
the `context` object into your controller and then you can do things like
`var referrer = context.req.headers.referer;` or something.

So your controller should do something like this:

```javascript
function MyController(context, db) {
	this.context = context;
	this.db = db;
};

MyController.prototype = {
	index: function(params, callback) {
		callback(goa.view('index.jade', {
			message: 'Welcome',
			referrer: this.context.req.headers.referer
		}));
	},

	save: function(params, callback) {
		var record = { content: params.content };
		this.db.insert(record, function(err, result) {
			if (err) {
				callback(goa.error(err));
				return;
			}

			callback(goa.redirect('/edit/' + result.id));
		});
	}
};
```

### Putting it all together
So, to set up your routes to use the controller above, you would do something like this:

```javascript
app.get('/', { controller: 'my' });
app.post('/save', { controller: 'my', action: 'save' });
```

As mentioned earlier, you can also use router parameters to define the
controller and action:

```javascript
// would handle requests like "/foo/bar" -> "foo" controller, "bar" action
app.get('/:controller/:action');

// "/post/edit/1" => "blog" controller, "edit" action; id would be in params.id
app.get('/post/:action/:id', { controller: 'blog' });
```
