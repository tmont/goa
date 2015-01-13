var methods = require('methods'),
	extend = require('extend');

function parseRequest(req, params) {
	return extend(
		req.query,
		req.body,
		req.params,
		params,
		{
			controller: params.controller || req.params.controller,
			action: params.action || req.params.action
		}
	);
}

function middleware(controllerFactory, actionParams, options) {
	return function(req, res, next) {
		var params = parseRequest(req, actionParams),
			controllerName = params.controller,
			action = params.action || options.defaultAction;

		var context = { req: req, res: res };
		controllerFactory(params.controller, context, function(err, controller) {
			if (err || !controller) {
				next(err || new Error('Unable to create controller "' + controllerName + '"'));
				return;
			}

			if (!controller[action]) {
				next(new Error('Unable to find action method "' + action + '" on controller "' + controllerName + '"'));
				return;
			}

			controller[action](params, function(result) {
				if (!result || !result.execute) {
					next(new Error('Action "' + controllerName + '.' + action + '" does not return a result object'));
					return;
				}

				result.execute(res, function(err, str) {
					if (err) {
						next(err);
						return;
					}

					res.send(str);
				});
			});
		});
	}
}

function createApplication(controllerFactory, options) {
	options = {
		defaultAction: (options && options.defaultAction) || 'index',
		express: (options && options.express) || require('express')
	};

	if (!controllerFactory || typeof(controllerFactory) !== 'function') {
		throw new Error('A controller factory function must be given');
	}

	var app = options.express(),
		curriedMiddleware = function(actionParams) {
			return middleware(controllerFactory, actionParams, options);
		};
	methods.concat([ 'all' ]).forEach(function(method) {
		var parent = app[method];
		app[method] = function() {
			//ugly hack from express for when you're trying to "get" a
			//setting instead of defining a GET route
			if (method === 'get' && arguments.length === 1) {
				return this.set(arguments[0]);
			}

			var middleware = Array.prototype.slice.call(arguments),
				actionParams = middleware.pop();

			if (typeof(actionParams) !== 'object') {
				middleware.push(actionParams);
				actionParams = {};
			}

			middleware.push(curriedMiddleware(actionParams));
			return parent.apply(this, middleware);
		};
	});
	app.del = app['delete'];
	app.middleware = curriedMiddleware;
	app.express = options.express;

	return app;
}

createApplication.parseRequest = parseRequest;
module.exports = createApplication;