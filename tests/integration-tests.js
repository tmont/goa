var should = require('should'),
	bodyParser = require('body-parser'),
	async = require('async'),
	goa = require('../'),
	http = require('http');

describe('Integration with Express', function() {
	var server, port = 9999;

	function setExpressOptions(app) {
		app.set('views', __dirname + '/files');
		app.set('view engine', 'jade');
	}

	afterEach(function(done) {
		if (!server) {
			done();
			return;
		}

		server.close(function() {
			server = null;
			done();
		});
	});

	function createController(name, context, callback) {
		callback(null, {
			content: function(params, send) {
				send(goa.action('oh hai there!'));
			},
			view: function(params, send) {
				send(goa.view('default', { message: 'foo bar' }));
			},
			error: function(params, send) {
				send(goa.error('lolz'));
			},
			file: function(params, send) {
				send(goa.file(__dirname + '/files/file.txt'));
			},
			download: function(params, send) {
				send(goa.file(__dirname + '/files/file.txt', { fileName: 'lol.txt' }));
			},
			downloadFromUrl: function(params, send) {
				send(goa.file('http://localhost:9999/file', { fileName: 'lol.txt' }));
			},
			fileError: function(params, send) {
				send(goa.error('lolz'));
			},
			redirect: function(params, send) {
				send(goa.redirect('/foo'));
			}
		});
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
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/content', { controller: 'foo', action: 'content' });
		server = app.listen(port);

		sendGetRequest('/content', function(res, body) {
			body.should.equal('oh hai there!');
			done();
		});
	});

	it('should render view', function(done) {
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/view', { controller: 'foo', action: 'view' });
		server = app.listen(port);

		sendGetRequest('/view', function(res, body) {
			body.should.equal('foo bar');
			done();
		});
	});

	it('should use express error handler for ErrorResult', function(done) {
		var app = goa(createController);
		setExpressOptions(app);

		app.get('/error', { controller: 'foo', action: 'error' });
		app.use(function(err, req, res, next) {
			err.should.equal('lolz');
			res.send('yay!');
		});
		server = app.listen(port);

		sendGetRequest('/error', function(res, body) {
			res.should.have.property('statusCode', 500);
			body.should.equal('yay!');
			done();
		});
	});

	it('should send file', function(done) {
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/file', { controller: 'foo', action: 'file' });
		server = app.listen(port);

		sendGetRequest('/file', function(res, body) {
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file', function(done) {
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/download', { controller: 'foo', action: 'download' });
		server = app.listen(port);

		sendGetRequest('/download', function(res, body) {
			res.headers.should.have.property('content-disposition', 'attachment; filename="lol.txt"');
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file from url', function(done) {
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/download', { controller: 'foo', action: 'downloadFromUrl' });
		app.get('/file', { controller: 'foo', action: 'file' });
		server = app.listen(port);

		sendGetRequest('/download', function(res, body) {
			res.statusCode.should.equal(200);
			res.headers.should.have.property('content-disposition', 'attachment; filename="lol.txt"');
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file from url and handle error', function(done) {
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/download', { controller: 'foo', action: 'downloadFromUrl' });
		app.get('/file', { controller: 'foo', action: 'fileError' });
		server = app.listen(port);

		sendGetRequest('/download', function(res, body) {
			res.statusCode.should.equal(500);
			body.should.equal('lolz\n');
			done();
		});
	});

	it('should redirect', function(done) {
		var app = goa(createController);
		setExpressOptions(app);
		app.get('/redirect', { controller: 'foo', action: 'redirect' });
		server = app.listen(port);

		sendGetRequest('/redirect', function(res) {
			res.headers.should.have.property('location', '/foo');
			res.should.have.property('statusCode', 302);
			done();
		});
	});

	it('should get controller and action from req.params', function(done) {
		var app = goa(function(name, context, callback) {
			name.should.equal('bar');
			callback(null, {
				content: function(params, send) {
					send(goa.action('oh hai there!'));
				}
			});
		});
		setExpressOptions(app);
		app.get('/:controller/:action', {});
		server = app.listen(port);

		sendGetRequest('/bar/content', function(res, body) {
			body.should.equal('oh hai there!');
			done();
		});
	});

	it('should expose express prototype', function(done) {
		var app = goa(function(name, context, callback) {
			callback(null, {
				sexyBody: function(params, send) {
					params.should.have.property('foo', 'bar');
					send(goa.action());
				}
			});
		});
		app.use(bodyParser.json());
		setExpressOptions(app);
		app.post('/sexy/body', { controller: 'foo', action: 'sexyBody' });
		server = app.listen(port);

		var options = {
			host: 'localhost',
			port: port,
			path: '/sexy/body',
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			}
		};
		var req = http.request(options, function(res) {
			res.on('data', function(){ });
			res.on('end', function() {
				done();
			});
		});

		req.write('{ "foo": "bar" }');
		req.end();
	});

	it('should allow user-supplied express object', function(done) {
		var app = goa(createController, {
			express: require('express')
		});
		setExpressOptions(app);
		app.get('/content', { controller: 'foo', action: 'content' });
		server = app.listen(port);

		sendGetRequest('/content', function(res, body) {
			body.should.equal('oh hai there!');
			done();
		});
	});

	it('should support express.all()', function(done) {
		var app = goa(function(name, context, callback) {
			callback(null, {
				all: function(params, send) {
					send(goa.action(context.req.method));
				}
			});
		});
		app.use(bodyParser.json());
		setExpressOptions(app);
		app.all('/all', {controller: 'foo', action: 'all'});
		server = app.listen(port);

		function doRequest(method, next) {
			var options = {
				host: 'localhost',
				port: port,
				path: '/all',
				method: method,
				headers: {
					'content-type': 'application/json'
				}
			};
			var req = http.request(options, function(res) {
				var body = '';
				res.on('data', function(chunk) {
					body += chunk;
				});
				res.on('end', function() {
					body.should.equal(method);
					next();
				});
			});

			req.end();
		}

		async.eachSeries([ 'GET', 'OPTIONS', 'POST', 'PUT', 'DELETE' ], doRequest, done);
	});

	describe('different request methods', function() {
		var methods = require('methods');

		methods.concat([ 'del' ]).forEach(function(method) {
			if (method === 'connect') {
				//don't bother testing connect requests, since those are handled
				//differently within the http module
				return;
			}

			it('should handle ' + method.toUpperCase() + ' request', function(done) {
				var app = goa(function(params, context, callback) {
					callback(null, {
						index: function(params, send) {
							send(goa.action('oh hai there!'));
						}
					});
				});

				app[method]('/test', { controller: 'foo' });
				server = app.listen(port);
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