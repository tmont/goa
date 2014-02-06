var should = require('should'),
	goa = require('../');

describe('Goa', function() {
	it('should raise error if controllerFactory option not passed to constructor', function() {
		(function() { goa(); }).should.throwError();
	});

	describe('request handling', function() {
		it('should get controller and action from handler', function() {
			var params = goa.parseRequest(
				{ controller: 'nope', action: 'nope' },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should get controller and action from request params if not specified in handler', function() {
			var params = goa.parseRequest(
				{ params: { controller: 'foo', action: 'bar' } },
				{ }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should add request body to action params', function() {
			var params = goa.parseRequest(
				{ body: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should add request params to action params', function() {
			var params = goa.parseRequest(
				{ params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should add query string params to action params', function() {
			var params = goa.parseRequest(
				{ query: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should not override controller or action from query', function() {
			var params = goa.parseRequest(
				{ query: { controller: 'nope', action: 'nope' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should not override controller or action from body', function() {
			var params = goa.parseRequest(
				{ body: { controller: 'nope', action: 'nope' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should override query from params', function() {
			var params = goa.parseRequest(
				{ query: { foo: 'baz' }, params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should override query from body', function() {
			var params = goa.parseRequest(
				{ query: { foo: 'baz' }, body: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should override body from params', function() {
			var params = goa.parseRequest(
				{ body: { foo: 'baz' }, params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should merge extra params', function() {
			var params = goa.parseRequest(
				{ body: { foo: 'baz' }, params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar', lolwut: 'lulz' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('lolwut', 'lulz');
		});
	});

	describe('middleware', function() {
		it('should execute default action', function(done) {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				context.should.have.property('req');
				context.should.have.property('res');
				callback(null, {
					index: function(params, send) {
						should.exist(params);
						send({
							execute: function(res, next) {
								done();
							}
						});
					}
				});
			}

			var app = goa(fakeController);

			var req = {
					params: {}
				},
				res = {},
				next = function(err) {
					done('next() should not have been called: ' + err);
				};
			app.middleware({ controller: 'foo' })(req, res, next);
		});

		it('should execute specific action', function(done) {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				context.should.have.property('req');
				context.should.have.property('res');
				callback(null, {
					bar: function(params, callback) {
						should.exist(params);
						callback({
							execute: function(res, next) {
								done();
							}
						});
					}
				});
			}

			var app = goa(fakeController);

			var req = {
					params: {}
				},
				res = {},
				next = function(err) {
					done('next() should not have been called: ' + err);
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if controller cannot be created', function(done) {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback();
			}

			var app = goa(fakeController);

			var req = {
					params: {}
				},
				res = {},
				next = function(err) {
					err.should.be.instanceOf(Error);
					err.should.have.property('message', 'Unable to create controller "foo"');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if controllerFactory raises an error', function(done) {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback('oh no!');
			}

			var app = goa(fakeController);

			var req = {
					params: {}
				},
				res = {},
				next = function(err) {
					err.should.equal('oh no!');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if result is not passed back', function(done) {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback(null, {
					bar: function(params, send) {
						send();
					}
				});
			}

			var app = goa(fakeController);

			var req = {
					params: {}
				},
				res = {},
				next = function(err) {
					err.should.be.instanceOf(Error);
					err.should.have.property('message', 'Action "foo.bar" does not return a result object');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if action cannot be found on controller', function(done) {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback(null, {});
			}

			var app = goa(fakeController);

			var req = {
					params: {}
				},
				res = {},
				next = function(err) {
					err.should.be.instanceOf(Error);
					err.should.have.property('message', 'Unable to find action method "bar" on controller "foo"');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});
	});

	describe('results', function() {
		function createResponse(contentType, content, done) {
			return {
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal(contentType);
				},
				send: function(value) {
					value.should.eql(content);
					done();
				}
			}
		}
		it('default result', function(done) {
			goa.action().execute(createResponse('text/plain', '', done));
		});

		it('default result with content', function(done) {
			goa.action('foo', 'text/html').execute(createResponse('text/html', 'foo', done));
		});

		it('default result with status code', function(done) {
			var statusSet = false;
			goa.action('foo', 'text/html', { status: 201 }).execute({
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal('text/html');
				},
				status: function(statusCode) {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: function(content) {
					content.should.equal('foo');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('default result with implicit status code', function(done) {
			var statusSet = false;
			goa.action('foo', 'text/html', 201).execute({
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal('text/html');
				},
				status: function(statusCode) {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: function(content) {
					content.should.equal('foo');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('json result', function(done) {
			goa.json({ foo: 'bar' }).execute(createResponse('application/json', { foo: 'bar' }, done));
		});

		it('json result with status code', function(done) {
			var statusSet = false;
			goa.json({ foo: 'bar' }, { status: 201 }).execute({
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal('application/json');
				},
				status: function(statusCode) {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: function(content) {
					content.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('json result with implicit status code', function(done) {
			var statusSet = false;
			goa.json({ foo: 'bar' }, 201).execute({
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal('application/json');
				},
				status: function(statusCode) {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: function(content) {
					content.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('file result', function(done) {
			goa.file('file.txt').execute({
				sendfile: function(file) {
					file.should.equal('file.txt');
					done();
				}
			});
		});

		it('file result with status code', function(done) {
			var statusSet = false;
			goa.file('file.txt', { status: 204 }).execute({
				status: function(statusCode) {
					statusCode.should.equal(204);
					statusSet = true;
				},
				sendfile: function(file) {
					file.should.equal('file.txt');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('file result with implicit status code', function(done) {
			var statusSet = false;
			goa.file('file.txt', 204).execute({
				status: function(statusCode) {
					statusCode.should.equal(204);
					statusSet = true;
				},
				sendfile: function(file) {
					file.should.equal('file.txt');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('file result as download', function(done) {
			goa.file('file.txt', { fileName: 'foo.bar' }).execute({
				download: function(file, fileName) {
					file.should.equal('file.txt');
					fileName.should.equal('foo.bar');
					done();
				}
			});
		});

		it('view result', function(done) {
			goa.view('view.jade', { foo: 'bar' }).execute({
				render: function(view, params) {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					done();
				}
			});
		});

		it('view result with params as function', function(done) {
			function p() {
				return { foo: 'bar' };
			}
			goa.view('view.jade', p).execute({
				render: function(view, params) {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					done();
				}
			});
		});

		it('view result with status code', function(done) {
			var statusSet = false;
			goa.view('view.jade', { foo: 'bar' }, { status: 201 }).execute({
				status: function(statusCode) {
					statusCode.should.equal(201);
					statusSet = true;
				},
				render: function(view, params) {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('view result with implicit status code', function(done) {
			var statusSet = false;
			goa.view('view.jade', { foo: 'bar' }, 201).execute({
				status: function(statusCode) {
					statusCode.should.equal(201);
					statusSet = true;
				},
				render: function(view, params) {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('view result with explicit content type', function(done) {
			var contentTypeSet = false;
			goa.view('view.jade', { foo: 'bar' }, { contentType: 'text/foo' }).execute({
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal('text/foo');
					contentTypeSet = true;
				},
				render: function(view, params) {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					contentTypeSet.should.equal(true);
					done();
				}
			});
		});

		it('error result', function(done) {
			goa.error().execute({
				status: function(statusCode) {
					statusCode.should.equal(500);
				}
			}, function(err) {
				err.should.be.instanceOf(Error);
				err.should.have.property('message', 'An error occurred');
				done();
			});
		});

		it('error result with specific error', function(done) {
			goa.error('oh no!').execute({
				status: function(statusCode) {
					statusCode.should.equal(500);
				}
			}, function(err) {
				err.should.equal('oh no!');
				done();
			});
		});

		it('error result with specific status code', function(done) {
			goa.error(null, 502).execute({
				status: function(statusCode) {
					statusCode.should.equal(502);
				}
			}, function(err) {
				err.should.be.instanceOf(Error);
				err.should.have.property('message', 'An error occurred');
				done();
			});
		});

		it('error result with specific status code in options', function(done) {
			goa.error(null, { status: 499 }).execute({
				status: function(statusCode) {
					statusCode.should.equal(499);
				}
			}, function(err) {
				err.should.be.instanceOf(Error);
				err.should.have.property('message', 'An error occurred');
				done();
			});
		});

		it('redirect result', function(done) {
			var statusSet = false;
			goa.redirect('/foo').execute({
				redirect: function(statusCode, url) {
					statusCode.should.equal(302);
					url.should.equal('/foo');
					statusSet.should.equal(true);
					done();
				},
				status: function(statusCode) {
					statusCode.should.equal(302);
					statusSet = true;
				}
			});
		});

		it('redirect result with custom status code', function(done) {
			var statusSet = false;
			goa.redirect('/foo', 301).execute({
				redirect: function(statusCode, url) {
					statusCode.should.equal(301);
					url.should.equal('/foo');
					statusSet.should.equal(true);
					done();
				},
				status: function(statusCode) {
					statusCode.should.equal(301);
					statusSet = true;
				}
			});
		});

		it('redirect result with custom status code in options', function(done) {
			var statusSet = false;
			goa.redirect('/foo', { status: 301 }).execute({
				redirect: function(statusCode, url) {
					statusCode.should.equal(301);
					url.should.equal('/foo');
					statusSet.should.equal(true);
					done();
				},
				status: function(statusCode) {
					statusCode.should.equal(301);
					statusSet = true;
				}
			});
		});

		it('empty result', function(done) {
			var statusSet = false;
			goa.empty('text/html').execute({
				set: function(name, value) {
					name.should.equal('Content-Type');
					value.should.equal('text/html');
				},
				send: function(content) {
					content.should.equal('');
					statusSet.should.equal(true);
					done();
				},
				status: function(statusCode) {
					statusCode.should.equal(204);
					statusSet = true;
				}
			});
		});
	});
});