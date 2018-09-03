const http = require('http');

const parseRequest = (req, params) => {
	return {
		...req.query,
		...req.body,
		...req.params,
		...params,
		...{
			controller: params.controller || req.params.controller,
			action: params.action || req.params.action
		}
	};
};

const middleware = (controllerFactory, actionParams, options) => {
	return (req, res, next) => {
		const params = parseRequest(req, actionParams);
		const controllerName = params.controller;
		const action = params.action || options.defaultAction;

		const context = { req, res };
		let controllerHandled = false;
		const handleController = (err, controller) => {
			if (controllerHandled) {
				return;
			}

			controllerHandled = true;
			if (err || !controller) {
				next(err || new Error('Unable to create controller "' + controllerName + '"'));
				return;
			}

			const runAction = (actionName) => {
				const actionResult = controller[actionName](params, function(result) {
					if (!result || !result.execute) {
						next(new Error(`Action "${controllerName}.${action}" does not return a result object`));
						return;
					}

					result.execute(res, (err, str) => {
						if (err) {
							next(err);
							return;
						}

						res.send(str);
					});
				});

				if (actionResult && typeof(actionResult.then) === 'function') {
					actionResult.then(() => {}, next);
				}
			};

			try {
				if (typeof(controller[action]) === 'function') {
					runAction(action);
					return;
				}

				const unknownActionName = 'handleUnknownAction';
				if (typeof(controller[unknownActionName]) === 'function') {
					runAction(unknownActionName);
					return;
				}
			} catch (e) {
				next(e);
				return;
			}

			next(new Error(`Unable to find action method "${action}" on controller "${controllerName}"`));
		};

		let controllerPromise;
		try {
			controllerPromise = controllerFactory(params.controller, context, handleController);
		} catch (e) {
			handleController(e);
			return;
		}

		if (controllerPromise && typeof(controllerPromise.then) === 'function') {
			controllerPromise
				.then(
					controller => handleController(null, controller),
					err => handleController(err)
				);
		}
	}
};

const createApplication = (controllerFactory, options) => {
	if (!options || !options.express) {
		throw new Error('options.express is required');
	}

	options = {
		defaultAction: (options && options.defaultAction) || 'index',
		express: options.express
	};

	if (!controllerFactory || typeof(controllerFactory) !== 'function') {
		throw new Error('A controller factory function must be given');
	}

	const app = options.express();
	const curriedMiddleware = (actionParams) => middleware(controllerFactory, actionParams, options);

	const methods = http.METHODS.map(m => m.toLowerCase()).sort().concat([ 'all' ]);

	methods.forEach((method) => {
		const parent = app[method];
		if (!parent || typeof(parent) !== 'function') {
			return;
		}

		app[method] = (...args) => {
			//ugly hack from express for when you're trying to "get" a
			//setting instead of defining a GET route
			if (method === 'get' && args.length === 1) {
				return app.set(args[0]);
			}

			const middleware = args;
			let actionParams = middleware.pop();

			if (typeof(actionParams) !== 'object') {
				middleware.push(actionParams);
				actionParams = {};
			}

			middleware.push(curriedMiddleware(actionParams));
			return parent.apply(app, middleware);
		};
	});
	app.del = app['delete'];
	app.middleware = curriedMiddleware;
	app.express = options.express;

	return app;
};

module.exports = {
	createApplication,
	parseRequest,
};
