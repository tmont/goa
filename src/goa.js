var methods = require('methods'),
	results = require('./results'),
	defaultOptions = {
		defaultAction: 'index'
	},
	merge = function() {
		var original = arguments[0], override = true, start = 1;
		if (typeof(original) === 'boolean') {
			override = original;
			original = arguments[1];
			start = 2;
		}
		for (var i = start; i < arguments.length; i++) {
			var obj = arguments[i];
			if (typeof(obj) !== 'object') {
				continue;
			}

			for (var key in obj) {
				if (!override && original[key]) {
					continue;
				}

				original[key] = obj[key];
			}
		}

		return original;
	};

function Goa(express, options) {
	if (!(this instanceof Goa)) {
		return new Goa(express, options);
	}

	if (!express) {
		throw new Error('An instance of an Express app is required, e.g. "new GoaApp(express())"');
	}

	options = merge({}, defaultOptions, options);

	if (typeof(options.controllerFactory) !== 'function') {
		throw new Error('A controllerFactory function must be specified in options');
	}

	this.express = express;
	this.controllerFactory = options.controllerFactory;
	this.defaultAction = options.defaultAction;

}

Goa.prototype.middleware = function(actionParams) {
	return function(req, res, next) {
		var params = Goa.parseRequest(req, actionParams),
			controllerName = params.controller,
			action = params.action || this.defaultAction,
			controller = this.controllerFactory(params.controller, { req: req, res: res, next: next });

		if (!controller) {
			next(new Error('Unable to create controller "' + controllerName + '"'));
			return;
		}

		if (!controller[action]) {
			next(new Error('Unable to find action method "' + action + '" on controller ' + '"' + controllerName + '"'));
			return;
		}

		(controller[action](params) || new results.ActionResult()).execute(res, next);
	}.bind(this);
};

Goa.parseRequest = function(req, params) {
	return merge(false,
		{
			controller: params.controller || req.params.controller,
			action: params.action || req.params.action
		},
		req.params,
		req.body
	);
};

methods.forEach(function(method) {
	Goa.prototype[method] = function() {
		var middleware = Array.prototype.slice.call(arguments),
			actionParams = middleware.pop();

		middleware.push(this.middleware(actionParams));
		this.express[method].apply(this.express, middleware);
	};
});
Goa.prototype.del = Goa.prototype['delete'];

module.exports = Goa;