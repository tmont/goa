# Goa

Goa is a very small, very simple MVCish framework for Node. I say
"MVCish" because it's built on top of [Express](http://expressjs.com/)
which already handles views. So it's more like an "MC" framework.
Except it doesn't do much with models, either. Whatever. It does
SOMETHING, I'm sure of it.

[![NPM version](https://badge.fury.io/js/goa.png)](http://badge.fury.io/js/goa)

## Installation
Install via [NPM](https://github.com/isaacs/npm): `npm install goa`

### Legacy Express (3.x)
If you need legacy support for Express, you should use a version < 1.0.0 from NPM.
Source code is in the [express3](https://github.com/tmont/goa/tree/express3) branch.

## Usage
Goa sits on top of Express. It's Express all the way down. Except for the top.
Which is Goa.

### Do the thing
Goa is a drop-in replacement for [Express](https://github.com/expressjs/express):
all Goa apps are Express apps.

As of v3.0.0, the interface to create an application changed from `goa(...)`
to `goa.createApplication(...)`. Also, since v3.0.0 promises are supported in both
controller actions and controller factories.

As of v2.0.0, `express` is now a peer dependency which means you must supply
your own version of `express` to goa.

So, inside your sweet app, wherever you would normally initialize Express, do this
instead:

```javascript
const express = require('express');
const goa = require('goa');

const createController = (name, context, callback) => callback(null, {
	index: (params, send) => send(goa.action('yay!'))
});

// or, using a promise
const createControllerViaPromise = async (name, context) => {
	return await getMyController();
};

const app = goa.createApplication(createController, { express });
```

That will get your new Goa application up and running. Since it's just a normal
Express app, you can still `configure()` and `use()` and whatnot to your
heart's content (note that the `express` index is exposed on `app.express`):

```javascript
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
// etc.
```

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
So you need a controller.

A controller factory is a function that creates controllers. It
takes three arguments:

1. the name of the controller to create (dictated from your route handler up there)
2. a context, which contains stuff that might be useful (specifically, the `req` and `res`)
3. a callback in the normal convention: `callback(err, yourSweetController)`

The properties on your controller correspond to actions. So if your
route handler looks like this: `{ controller: 'foo', action: 'bar' }`,
then your `foo` controller better look like this:

```javascript
{
	bar: (params, send) => {
		// do stuff
	}
}
```

You can set up your controller factory however you want. Here's a sample one:

```javascript
const controllerFactory = (name, context, callback) => {
	//"foo" => "FooController"
	const className = name.charAt(0).toUpperCase() + name.substring(1) + 'Controller';

	//assuming the file name is "controllers/FooController.js"
	const Controller = require('./controllers/' + className);
	callback(null, new Controller(context));
}
```

### Action methods
Action methods are properties on controllers, like the "bar" thing we did up
above. They should always return some kind of `Result` object. There are seven
built-in `Result` objects:

1. `ActionResult(content[, contentType, options])` - simply sends whatever content you give it
	* `goa.action('foo bar', 'text/plain');`
2. `JsonResult(json[, options])` - sends JSON
	* `goa.json({ foo: 'bar' });`
3. `FileResult(file[, options])` - sends a file (uses `res.sendfile()` and `res.download()`)
	* `goa.file('/path/to/file');`
	* `goa.file('/path/to/file', { maxAge: 60000 });`
	* `goa.file('/path/to/file', { fileName: 'foo.txt' });` - sets `Content-Disposition` header
	* `goa.file('http://example.com/foo.txt');` - acts as reverse proxy
4. `ViewResult(view[, params, options])` - renders a view with optional params
	* `goa.view('index.jade', { message: 'Welcome!' });`
	* `goa.view('index.jade', { message: 'Welcome!' }, { contentType: 'text/xml' });`
	* `goa.view('index.jade', function() { return { message: 'Welcome!' });`
5. `ErrorResult(error[, options = 500])` - delegates to Express's error handler
	* `goa.error(new Error('Verboten!'), 403);`
6. `RedirectResult(location[, options = 302])` - redirects to `location`
	* `goa.redirect('/foo');`
7. `EmptyResult([contentType])` - sends an empty response with status `204`

All result objects should have an `execute(res, next)` function, if you decide to
implement your own.

Notice that each `Result` constructor has an `options` parameter. This can
be used for setting the status code of any of the results (it may be used
for additional things in the future). For all results except `EmptyResult`
you can simply pass a number for the status code, or an object `{ status: 404 }`:
they are equivalent. `EmptyResult` always sets the status code to `204 No Content`.

The preferred way of using the built-in result objects is via their factory
functions on the `goa` object, e.g. `goa.view('myview')`. But, if you like
typing, you can also access their constructors directly off of the
`goa.results` object: `new goa.results.ViewResult('myview')`.

Action methods are passed a `params` object, which is a conglomeration of `req.query`,
`req.body` and `req.params`, in that order. That is, `req.query.foo` will be overridden
by `req.body.foo`, which will be overridden by `req.params.foo`.

If you need access to the raw request, you should make sure and inject
the `context` object into your controller and then you can do things like
`var referrer = context.req.headers.referer;` or something.

So your controller should do something like this:

```javascript
class MyController {
	constructor(context, db) {
		this.context = context;
		this.db = db;
	}
	
	index(params, send) {
		send(goa.view('index.pug', {
			message: 'Welcome',
			referrer: this.context.req.headers.referer
		}));
	}
	
	save(params, send) {
		const record = { content: params.content };
		this.db.insert(record, (err, result) => {
			if (err) {
				send(goa.error(err));
				return;
			}
	
			send(goa.redirect(`/edit/${result.id}`));
		});
	}
	
	// also supports promises
	async savePromise(params, send) {
		try {
			const result = await this.db.insert(record);
			send(goa.redirect(`/edit/${result.id}`));
		} catch (e) {
			send(goa.error(e));
		}
	}
}
```

The same in TypeScript: 
```typescript
import * as goa from 'goa';

interface SaveParams {
	content: string;
}

class MyController {
	private readonly context: goa.ControllerContext;
	private readonly db: any;
	
	public constructor(context: goa.ControllerContext, db: any) {
		this.context = context;
		this.db = db;
	}
	
	index(params: goa.ActionParams, send: goa.Send) {
		send(goa.view('index.pug', {
			message: 'Welcome',
			referrer: this.context.req.headers.referer
		}));
	}
	
	save(params: goa.ActionParams<SaveParams>, send: goa.Send) {
		const record: any = { content: params.content };
		this.db.insert(record, (err, result) => {
			if (err) {
				send(goa.error(err));
				return;
			}
	
			send(goa.redirect(`/edit/${result.id}`));
		});
	}
	
	public async savePromise(params: goa.ActionParams<SaveParams>, send: goa.Send) {
		try {
			const record: any = { content: params.content };
			const result = await this.db.insert(record);
			send(goa.redirect(`/edit/${result.id}`));
		} catch (e) {
			send(goa.error(e));
		}
	}
}
```

#### Unknown Actions
If an action is attempting to be executed, that doesn't exist on the controller, goa will
raise an error, which you can handle in your express error handler.

If you want more finegrained control over those errors, you can define a `handleUnknownAction`
method on your controller.

```javascript
{
	handleUnknownAction: (params, send) => {
		send(goa.view('errors/404', { message: 'That page does not exist' }, 404));
	}
}
```

#### Hooking into rendering process
The `send` argument also accepts an `onComplete` callback:

```javascript
{
	myAction: (params, send) => {
		const renderStart = Date.now();
		send(goa.view('some/view', { hello: 'world' }), (err) => {
			if (err) {
				console.error(`rendering encountered an error: ${err.message}`);
			}
			const renderElapsed = Date.now() - renderStart;
			console.log(`rendering took ${renderElapsed}ms`);
		});
	}
}
```

Note that any errors thrown from the `onComplete` callback will be ignored.

The `onComplete` callback can return a promise. Note that the promise will resolve
_before_ sending the response back to the client, so it's not recommended to perform
any heavy tasks inside the `onComplete` callback as it can hide slowness from the
normal program flow. Errors resulting from a rejected promise are ignored.

```javascript
{
	myAction: (params, send) => {
		const renderStart = Date.now();
		send(goa.view('some/view', { hello: 'world' }), async (err) => {
			const renderElapsed = Date.now() - renderStart;
			await db.execute('INSERT INTO render_times (timestamp, elapsed) VALUES (?, ?)', Date.now(), renderElapsed);
		});
	}
}
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
app.get('/:controller/:action', {});

// "/post/edit/1" => "blog" controller, "edit" action; id would be in params.id
app.get('/post/:action/:id', { controller: 'blog' });
```
