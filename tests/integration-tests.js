require('should');
const bodyParser = require('body-parser');
const express = require('express');
const async = require('async');
const goa = require('../');
const http = require('http');

describe('Integration with Express', () => {
	let server;
	const port = 9999;

	function setExpressOptions(app) {
		app.set('views', __dirname + '/files');
		app.set('view engine', 'pug');
	}

	afterEach((done) => {
		if (!server) {
			done();
			return;
		}

		server.close(() => {
			server = null;
			done();
		});
	});

	function createController(name, context, callback) {
		callback(null, {
			content: (params, send) => {
				send(goa.action('oh hai there!'));
			},
			view: (params, send) => {
				send(goa.view('default', { message: 'foo bar' }));
			},
			error: (params, send) => {
				send(goa.error('lolz'));
			},
			file: (params, send) => {
				send(goa.file(__dirname + '/files/file.txt'));
			},
			download: (params, send) => {
				send(goa.file(__dirname + '/files/file.txt', { fileName: 'lol.txt' }));
			},
			downloadFromUrl: (params, send) => {
				send(goa.file('http://localhost:9999/file', { fileName: 'lol.txt' }));
			},
			fileError: (params, send) => {
				send(goa.error('lolz'));
			},
			redirect: (params, send) => {
				send(goa.redirect('/foo'));
			}
		});
	}

	function sendGetRequest(path, callback) {
		http.get('http://localhost:' + port + path, (res) => {
			let body = '';
			res.on('data', (chunk) => {
				body += chunk;
			});
			res.on('end', () => {
				callback(res, body);
			});
		});
	}

	it('should send content', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/content', { controller: 'foo', action: 'content' });
		server = app.listen(port);

		sendGetRequest('/content', (res, body) => {
			body.should.equal('oh hai there!');
			done();
		});
	});

	it('should render view', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/view', { controller: 'foo', action: 'view' });
		server = app.listen(port);

		sendGetRequest('/view', (res, body) => {
			body.should.equal('foo bar');
			done();
		});
	});

	it('should use express error handler for ErrorResult', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);

		app.get('/error', { controller: 'foo', action: 'error' });
		app.use((err, req, res, next) => {
			err.should.equal('lolz');
			res.send('yay!');
		});
		server = app.listen(port);

		sendGetRequest('/error', (res, body) => {
			res.should.have.property('statusCode', 500);
			body.should.equal('yay!');
			done();
		});
	});

	it('should send file', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/file', { controller: 'foo', action: 'file' });
		server = app.listen(port);

		sendGetRequest('/file', (res, body) => {
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/download', { controller: 'foo', action: 'download' });
		server = app.listen(port);

		sendGetRequest('/download', (res, body) => {
			res.headers.should.have.property('content-disposition', 'attachment; filename="lol.txt"');
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file from url', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/download', { controller: 'foo', action: 'downloadFromUrl' });
		app.get('/file', { controller: 'foo', action: 'file' });
		server = app.listen(port);

		sendGetRequest('/download', (res, body) => {
			res.statusCode.should.equal(200);
			res.headers.should.have.property('content-disposition', 'attachment; filename="lol.txt"');
			body.should.equal('this is a file');
			done();
		});
	});

	it('should download file from url and handle error', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/download', { controller: 'foo', action: 'downloadFromUrl' });
		app.get('/file', { controller: 'foo', action: 'fileError' });
		server = app.listen(port);

		sendGetRequest('/download', (res, body) => {
			res.statusCode.should.equal(500);
			body.should.equal('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>lolz</pre>\n</body>\n</html>\n');
			done();
		});
	});

	it('should redirect', (done) => {
		const app = goa.createApplication(createController, { express });
		setExpressOptions(app);
		app.get('/redirect', { controller: 'foo', action: 'redirect' });
		server = app.listen(port);

		sendGetRequest('/redirect', (res) => {
			res.headers.should.have.property('location', '/foo');
			res.should.have.property('statusCode', 302);
			done();
		});
	});

	it('should get controller and action from req.params', (done) => {
		const app = goa.createApplication((name, context, callback) => {
			name.should.equal('bar');
			callback(null, {
				content: (params, send) => {
					send(goa.action('oh hai there!'));
				}
			});
		}, { express });
		setExpressOptions(app);
		app.get('/:controller/:action', {});
		server = app.listen(port);

		sendGetRequest('/bar/content', (res, body) => {
			body.should.equal('oh hai there!');
			done();
		});
	});

	it('should expose express prototype', (done) => {
		const app = goa.createApplication((name, context, callback) => {
			callback(null, {
				sexyBody: (params, send) => {
					params.should.have.property('foo', 'bar');
					send(goa.action());
				}
			});
		}, { express });
		app.use(bodyParser.json());
		setExpressOptions(app);
		app.post('/sexy/body', { controller: 'foo', action: 'sexyBody' });
		server = app.listen(port);

		const options = {
			host: 'localhost',
			port: port,
			path: '/sexy/body',
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			}
		};
		const req = http.request(options, (res) => {
			res.on('data', function(){ });
			res.on('end', () => {
				done();
			});
		});

		req.write('{ "foo": "bar" }');
		req.end();
	});

	it('should support express.all()', (done) => {
		const app = goa.createApplication((name, context, callback) => {
			callback(null, {
				all: (params, send) => {
					send(goa.action(context.req.method));
				}
			});
		}, { express });
		app.use(bodyParser.json());
		setExpressOptions(app);
		app.all('/all', {controller: 'foo', action: 'all'});
		server = app.listen(port);

		function doRequest(method, next) {
			const options = {
				host: 'localhost',
				port: port,
				path: '/all',
				method: method,
				headers: {
					'content-type': 'application/json'
				}
			};
			const req = http.request(options, (res) => {
				let body = '';
				res.on('data', (chunk) => {
					body += chunk;
				});
				res.on('end', () => {
					body.should.equal(method);
					next();
				});
			});

			req.end();
		}

		async.eachSeries([ 'GET', 'OPTIONS', 'POST', 'PUT', 'DELETE' ], doRequest, done);
	});

	describe('different request methods', () => {
		const methods = http.METHODS;

		methods.concat([ 'del' ]).forEach((method) => {
			if (method === 'connect') {
				//don't bother testing connect requests, since those are handled
				//differently within the http module
				return;
			}

			it('should handle ' + method.toUpperCase() + ' request', (done) => {
				const app = goa.createApplication((params, context, callback) => {
					callback(null, {
						index: (params, send) => {
							send(goa.action('oh hai there!'));
						}
					});
				}, { express });

				if (!app[method]) {
					done();
					return;
				}

				app[method]('/test', { controller: 'foo' });
				server = app.listen(port);
				const realMethod = method === 'del' ? 'delete' : method;
				http.request({ host: 'localhost', port: port, path: '/test', method: realMethod },(res) => {
					let body = '';
					res.on('data', (chunk) => {
						body += chunk;
					});
					res.on('end', () => {
						const expected = method === 'head' ? '' : 'oh hai there!';
						body.should.equal(expected);
						done();
					});
				}).end();
			});
		});
	});
});
