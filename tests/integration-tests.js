var should = require('should'),
	express = require('express'),
	goa = require('../'),
	http = require('http');

describe('Integration with Express', function() {
	var expressApp, server, port = 9999;

	beforeEach(function() {
		expressApp = express();
		expressApp.use(express.bodyParser());
		expressApp.set('views', __dirname + '/files');
		expressApp.set('view engine', 'jade');
		expressApp.use(expressApp.router);
	});

	afterEach(function(done) {
		expressApp = null;
		if (!server) {
			done();
			return;
		}

		server.close(function() {
			server = null;
			done();
		});
	});

	function createController(name, context) {
		return {
			content: function(params, callback) {
				callback(new goa.ActionResult('oh hai there!'));
			},
			view: function(params, callback) {
				callback(new goa.ViewResult('default', { message: 'foo bar' }));
			},
			error: function(params, callback) {
				callback(new goa.ErrorResult('lolz'));
			},
			file: function(params, callback) {
				callback(new goa.FileResult(__dirname + '/files/file.txt'));
			},
			download: function(params, callback) {
				callback(new goa.FileResult(__dirname + '/files/file.txt', { fileName: 'lol.txt' }));
			},
			redirect: function(params, callback) {
				callback(new goa.RedirectResult('/foo'));
			}
		};
	}

	function sendGetRequest(path, callback) {
		http.get('http://localhost:' + port + path, function(res) {
			var body = '';
			res.on('data', function(chunk) {
				body += chunk;
			});
			res.on('end', function() {
				callback(res, body);
			});
		});
	}

	it('should send content', function(done) {
		var app = goa(expressApp, { controllerFactory: createController });
		app.get('/content', { controller: 'foo', action: 'content' });
		server = expressApp.listen(port);

		sendGetRequest('/content', function(res, body) {
			body.should.equal('oh hai there!');
			done();
		});
	});

	it('should render view', function(done) {
		var app = goa(expressApp, { controllerFactory: createController });
		app.get('/view', { controller: 'foo', action: 'view' });
		server = expressApp.listen(port);

		sendGetRequest('/view', function(res, body) {
			body.should.equal('foo bar');
			done();
		});
	});

	it('should use express error handler for ErrorResult', function(done) {
		var app = goa(expressApp, { controllerFactory: createController });
		expressApp.use(function(err, req, res, next) {
			err.should.equal('lolz');
			res.send('yay!');
		});
		app.get('/error', { controller: 'foo', action: 'error' });
		server = expressApp.listen(port);

		sendGetRequest('/error', function(res, body) {
			res.should.have.property('statusCode', 500);
			body.should.equal('yay!');
			done();
		});
	});

	it('should send file', function(done) {
		var app = goa(expressApp, { controllerFactory: createController });
		app.get('/file', { controller: 'foo', action: 'file' });
		server = expressApp.listen(port);

		sendGetRequest('/file', function(res, body) {
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file', function(done) {
		var app = goa(expressApp, { controllerFactory: createController });
		app.get('/download', { controller: 'foo', action: 'download' });
		server = expressApp.listen(port);

		sendGetRequest('/download', function(res, body) {
			res.headers.should.have.property('content-disposition', 'attachment; filename="lol.txt"');
			body.should.equal('this is a file');
			done();
		});
	});

	it('should redirect', function(done) {
		var app = goa(expressApp, { controllerFactory: createController });
		app.get('/redirect', { controller: 'foo', action: 'redirect' });
		server = expressApp.listen(port);

		sendGetRequest('/redirect', function(res) {
			res.headers.should.have.property('location', '/foo');
			res.should.have.property('statusCode', 302);
			done();
		});
	});

	it('should get controller and action from req.params', function(done) {
		var app = goa(expressApp, { controllerFactory: function(name) {
			name.should.equal('bar');
			return {
				content: function(params, callback) {
					callback(new goa.ActionResult('oh hai there!'));
				}
			}
		}});
		app.get('/:controller/:action');
		server = expressApp.listen(port);

		sendGetRequest('/bar/content', function(res, body) {
			body.should.equal('oh hai there!');
			done();
		});
	});

	describe('different request methods', function() {
		var methods = require('methods');

		methods.concat([ 'del' ]).forEach(function(method) {
			it('should handle ' + method.toUpperCase() + ' request', function(done) {
				var app = goa(expressApp, { controllerFactory: function() {
					return {
						index: function(params, callback) {
							callback(new goa.ActionResult('oh hai there!'));
						}
					}
				}});

				app[method]('/test', { controller: 'foo' });
				server = expressApp.listen(port);
				var realMethod = method === 'del' ? 'delete' : method;
				http.request({ host: 'localhost', port: port, path: '/test', method: realMethod },function(res) {
					var body = '';
					res.on('data', function(chunk) {
						body += chunk;
					});
					res.on('end', function() {
						var expected = method === 'head' ? '' : 'oh hai there!';
						body.should.equal(expected);
						done();
					});
				}).end();
			});
		});
	});
});