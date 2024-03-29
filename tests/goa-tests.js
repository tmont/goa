const should = require('should');
const express = require('express');
const goa = require('../');

describe('Goa', () => {
	it('should raise error if controllerFactory option not passed to constructor', () => {
		(() => { goa.createApplication(); }).should.throwError();
	});

	describe('request handling', () => {
		it('should get controller and action from handler', () => {
			const params = goa.parseRequest(
				{ controller: 'nope', action: 'nope' },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should get controller and action from request params if not specified in handler', () => {
			const params = goa.parseRequest(
				{ params: { controller: 'foo', action: 'bar' } },
				{ }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should add request body to action params', () => {
			const params = goa.parseRequest(
				{ body: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should add request params to action params', () => {
			const params = goa.parseRequest(
				{ params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should add query string params to action params', () => {
			const params = goa.parseRequest(
				{ query: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should not override controller or action from query', () => {
			const params = goa.parseRequest(
				{ query: { controller: 'nope', action: 'nope' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should not override controller or action from body', () => {
			const params = goa.parseRequest(
				{ body: { controller: 'nope', action: 'nope' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
		});

		it('should override query from params', () => {
			const params = goa.parseRequest(
				{ query: { foo: 'baz' }, params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should override query from body', () => {
			const params = goa.parseRequest(
				{ query: { foo: 'baz' }, body: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should override body from params', () => {
			const params = goa.parseRequest(
				{ body: { foo: 'baz' }, params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('foo', 'bar');
		});

		it('should merge extra params', () => {
			const params = goa.parseRequest(
				{ body: { foo: 'baz' }, params: { foo: 'bar' } },
				{ controller: 'foo', action: 'bar', lolwut: 'lulz' }
			);

			should.exist(params);

			params.should.have.property('controller', 'foo');
			params.should.have.property('action', 'bar');
			params.should.have.property('lolwut', 'lulz');
		});
	});

	describe('middleware', () => {
		it('should execute default action', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				context.should.have.property('req');
				context.should.have.property('res');
				callback(null, {
					index: (params, send) => {
						should.exist(params);
						send({
							execute: () => {
								done();
							}
						});
					}
				});
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					done('next() should not have been called: ' + err);
				};
			app.middleware({ controller: 'foo' })(req, res, next);
		});

		it('should execute specific action', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				context.should.have.property('req');
				context.should.have.property('res');
				callback(null, {
					bar: (params, callback) => {
						should.exist(params);
						callback({ execute: () => done() });
					}
				});
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					done('next() should not have been called: ' + err);
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if controller cannot be created', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback();
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					err.should.be.instanceOf(Error);
					err.should.have.property('message', 'Unable to create controller "foo"');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if controllerFactory raises an error', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback('oh no!');
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					err.should.equal('oh no!');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if result is not passed back', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback(null, {
					bar: (params, send) => {
						send();
					}
				});
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					err.should.be.instanceOf(Error);
					err.should.have.property('message', 'Action "foo.bar" does not return a result object');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should raise error if action cannot be found on controller', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback(null, {});
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					err.should.be.instanceOf(Error);
					err.should.have.property('message', 'Unable to find action method "bar" on controller "foo"');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('should call unknown action handler if original action does not exist', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback(null, {
					handleUnknownAction: (params, callback) => {
						should.exist(params);
						callback({ execute: () => done() });
					}
				});
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {},
				next = (err) => {
					done('next() should not have been called: ' + err);
				};

			app.middleware({controller: 'foo', action: 'bar'})(req, res, next);
		});

		describe('onComplete callback', () => {
			it('should call callback after successful request', (done) => {
				let onComplete = false;
				let onCompleteError = null;

				const finish = () => {
					onComplete.should.equal(true);
					should.equal(onCompleteError, null);
					done();
				};

				const execute = (res, callback) => callback();

				function fakeController(name, context, callback) {
					name.should.equal('foo');
					context.should.have.property('req');
					context.should.have.property('res');
					callback(null, {
						bar: (params, send) => {
							send({execute: execute}, (err) => {
								onComplete = true;
								onCompleteError = err || null;
							});
						}
					});
				}

				const app = goa.createApplication(fakeController, {express});

				const req = {
						params: {}
					},
					res = {
						send: finish,
					},
					next = (err) => {
						done('next() should not have been called: ' + err);
					};
				app.middleware({controller: 'foo', action: 'bar'})(req, res, next);
			});

			it('should ignore thrown errors', (done) => {
				let onComplete = false;
				let onCompleteError = null;

				const finish = () => {
					onComplete.should.equal(true);
					should.equal(onCompleteError, null);
					done();
				};

				const execute = (res, callback) => callback();

				function fakeController(name, context, callback) {
					name.should.equal('foo');
					context.should.have.property('req');
					context.should.have.property('res');
					callback(null, {
						bar: (params, send) => {
							send({execute: execute}, (err) => {
								onComplete = true;
								onCompleteError = err || null;
								throw new Error('this should be completely ignored');
							});
						}
					});
				}

				const app = goa.createApplication(fakeController, {express});

				const req = {
						params: {}
					},
					res = {
						send: finish,
					},
					next = (err) => {
						done('next() should not have been called: ' + err);
					};
				app.middleware({controller: 'foo', action: 'bar'})(req, res, next);
			});

			it('should pass along error after failed request', (done) => {
				let onComplete = false;
				let onCompleteError = null;
				const error = new Error('oh no!');

				const finish = () => {
					done('res.send() should not have been called');
				};

				const execute = (res, callback) => callback(error);

				function fakeController(name, context, callback) {
					name.should.equal('foo');
					context.should.have.property('req');
					context.should.have.property('res');
					callback(null, {
						bar: (params, send) => {
							send({execute: execute}, (err) => {
								onComplete = true;
								onCompleteError = err || null;
							});
						}
					});
				}

				const app = goa.createApplication(fakeController, {express});

				const req = {
						params: {}
					},
					res = {
						send: finish,
					},
					next = (err) => {
						onComplete.should.equal(true);
						should.equal(onCompleteError, err);
						should.equal(err, error);
						done();

					};
				app.middleware({controller: 'foo', action: 'bar'})(req, res, next);
			});

			describe('promises', () => {
				it('should wait for promise to be fulfilled after successful request', (done) => {
					let onComplete = false;
					let onCompleteError = null;
					let promiseFulfilled = false;

					const finish = () => {
						onComplete.should.equal(true);
						should.equal(onCompleteError, null);
						promiseFulfilled.should.equal(true);
						done();
					};

					const execute = (res, callback) => callback();

					function fakeController(name, context, callback) {
						name.should.equal('foo');
						context.should.have.property('req');
						context.should.have.property('res');
						callback(null, {
							bar: (params, send) => {
								send({execute: execute}, (err) => {
									onComplete = true;
									onCompleteError = err || null;
									return new Promise((resolve) => {
										setTimeout(() => {
											promiseFulfilled = true;
											resolve();
										}, 20);
									});
								});
							}
						});
					}

					const app = goa.createApplication(fakeController, {express});

					const req = {
							params: {}
						},
						res = {
							send: finish,
						},
						next = (err) => {
							done('next() should not have been called: ' + err);
						};
					app.middleware({controller: 'foo', action: 'bar'})(req, res, next);
				});

				it('should ignore promise rejections', (done) => {
					let onComplete = false;
					let onCompleteError = null;
					let promiseFulfilled = false;

					const finish = () => {
						onComplete.should.equal(true);
						should.equal(onCompleteError, null);
						promiseFulfilled.should.equal(true);
						done();
					};

					const execute = (res, callback) => callback();

					function fakeController(name, context, callback) {
						name.should.equal('foo');
						context.should.have.property('req');
						context.should.have.property('res');
						callback(null, {
							bar: (params, send) => {
								send({execute: execute}, (err) => {
									onComplete = true;
									onCompleteError = err || null;
									return new Promise((resolve, reject) => {
										setTimeout(() => {
											promiseFulfilled = true;
											reject();
										}, 20);
									});
								});
							}
						});
					}

					const app = goa.createApplication(fakeController, {express});

					const req = {
							params: {}
						},
						res = {
							send: finish,
						},
						next = (err) => {
							done('next() should not have been called: ' + err);
						};
					app.middleware({controller: 'foo', action: 'bar'})(req, res, next);
				});
			});
		});
	});

	describe('results', () => {
		function createResponse(contentType, content, done) {
			return {
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal(contentType);
				},
				send: (value) => {
					value.should.eql(content);
					done();
				}
			}
		}
		it('default result', (done) => {
			goa.action().execute(createResponse('text/plain', '', done));
		});

		it('default result with content', (done) => {
			goa.action('foo', 'text/html').execute(createResponse('text/html', 'foo', done));
		});

		it('default result with status code', (done) => {
			let statusSet = false;
			goa.action('foo', 'text/html', { status: 201 }).execute({
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal('text/html');
				},
				status: (statusCode) => {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: (content) => {
					content.should.equal('foo');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('default result with implicit status code', (done) => {
			let statusSet = false;
			goa.action('foo', 'text/html', 201).execute({
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal('text/html');
				},
				status: (statusCode) => {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: (content) => {
					content.should.equal('foo');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('json result', (done) => {
			goa.json({ foo: 'bar' }).execute(createResponse('application/json', { foo: 'bar' }, done));
		});

		it('json result with status code', (done) => {
			let statusSet = false;
			goa.json({ foo: 'bar' }, { status: 201 }).execute({
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal('application/json');
				},
				status: (statusCode) => {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: (content) => {
					content.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('json result with implicit status code', (done) => {
			let statusSet = false;
			goa.json({ foo: 'bar' }, 201).execute({
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal('application/json');
				},
				status: (statusCode) => {
					statusCode.should.equal(201);
					statusSet = true;
				},
				send: (content) => {
					content.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('file result', (done) => {
			goa.file('file.txt').execute({
				sendFile: (file) => {
					file.should.equal('file.txt');
					done();
				}
			});
		});

		it('file result with status code', (done) => {
			let statusSet = false;
			goa.file('file.txt', { status: 204 }).execute({
				status: (statusCode) => {
					statusCode.should.equal(204);
					statusSet = true;
				},
				sendFile: (file) => {
					file.should.equal('file.txt');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('file result with implicit status code', (done) => {
			let statusSet = false;
			goa.file('file.txt', 204).execute({
				status: (statusCode) => {
					statusCode.should.equal(204);
					statusSet = true;
				},
				sendFile: (file) => {
					file.should.equal('file.txt');
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('file result as download', (done) => {
			goa.file('file.txt', { fileName: 'foo.bar' }).execute({
				download: (file, fileName) => {
					file.should.equal('file.txt');
					fileName.should.equal('foo.bar');
					done();
				}
			});
		});

		it('view result', (done) => {
			goa.view('view.jade', { foo: 'bar' }).execute({
				render: (view, params) => {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					done();
				}
			});
		});

		it('view result with params as function', (done) => {
			function p() {
				return { foo: 'bar' };
			}
			goa.view('view.jade', p).execute({
				render: (view, params) => {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					done();
				}
			});
		});

		it('view result with status code', (done) => {
			let statusSet = false;
			goa.view('view.jade', { foo: 'bar' }, { status: 201 }).execute({
				status: (statusCode) => {
					statusCode.should.equal(201);
					statusSet = true;
				},
				render: (view, params) => {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('view result with implicit status code', (done) => {
			let statusSet = false;
			goa.view('view.jade', { foo: 'bar' }, 201).execute({
				status: (statusCode) => {
					statusCode.should.equal(201);
					statusSet = true;
				},
				render: (view, params) => {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					statusSet.should.equal(true);
					done();
				}
			});
		});

		it('view result with explicit content type', (done) => {
			let contentTypeSet = false;
			goa.view('view.jade', { foo: 'bar' }, { contentType: 'text/foo' }).execute({
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal('text/foo');
					contentTypeSet = true;
				},
				render: (view, params) => {
					view.should.equal('view.jade');
					params.should.eql({ foo: 'bar' });
					contentTypeSet.should.equal(true);
					done();
				}
			});
		});

		it('view result that cannot be rendered', (done) => {
			function fakeController(name, context, callback) {
				name.should.equal('foo');
				callback(null, {
					bar: (params, send) => {
						send(goa.view('foo', {}));
					}
				});
			}

			const app = goa.createApplication(fakeController, { express });

			const req = {
					params: {}
				},
				res = {
					render: (view, locals, fn) => {
						fn(new Error('fail'));
					}
				},
				next = (err) => {
					should.exist(err);
					err.should.have.property('message', 'fail');
					done();
				};
			app.middleware({ controller: 'foo', action: 'bar' })(req, res, next);
		});

		it('error result', (done) => {
			goa.error().execute({
				status: (statusCode) => {
					statusCode.should.equal(500);
				}
			}, (err) => {
				err.should.be.instanceOf(Error);
				err.should.have.property('message', 'An error occurred');
				done();
			});
		});

		it('error result with specific error', (done) => {
			goa.error('oh no!').execute({
				status: (statusCode) => {
					statusCode.should.equal(500);
				}
			}, (err) => {
				err.should.equal('oh no!');
				done();
			});
		});

		it('error result with specific status code', (done) => {
			goa.error(null, 502).execute({
				status: (statusCode) => {
					statusCode.should.equal(502);
				}
			}, (err) => {
				err.should.be.instanceOf(Error);
				err.should.have.property('message', 'An error occurred');
				done();
			});
		});

		it('error result with specific status code in options', (done) => {
			goa.error(null, { status: 499 }).execute({
				status: (statusCode) => {
					statusCode.should.equal(499);
				}
			}, (err) => {
				err.should.be.instanceOf(Error);
				err.should.have.property('message', 'An error occurred');
				done();
			});
		});

		it('redirect result', (done) => {
			let statusSet = false;
			goa.redirect('/foo').execute({
				redirect: (statusCode, url) => {
					statusCode.should.equal(302);
					url.should.equal('/foo');
					statusSet.should.equal(true);
					done();
				},
				status: (statusCode) => {
					statusCode.should.equal(302);
					statusSet = true;
				}
			});
		});

		it('redirect result with custom status code', (done) => {
			let statusSet = false;
			goa.redirect('/foo', 301).execute({
				redirect: (statusCode, url) => {
					statusCode.should.equal(301);
					url.should.equal('/foo');
					statusSet.should.equal(true);
					done();
				},
				status: (statusCode) => {
					statusCode.should.equal(301);
					statusSet = true;
				}
			});
		});

		it('redirect result with custom status code in options', (done) => {
			let statusSet = false;
			goa.redirect('/foo', { status: 301 }).execute({
				redirect: (statusCode, url) => {
					statusCode.should.equal(301);
					url.should.equal('/foo');
					statusSet.should.equal(true);
					done();
				},
				status: (statusCode) => {
					statusCode.should.equal(301);
					statusSet = true;
				}
			});
		});

		it('empty result', (done) => {
			let statusSet = false;
			goa.empty('text/html').execute({
				set: (name, value) => {
					name.should.equal('Content-Type');
					value.should.equal('text/html');
				},
				send: (content) => {
					content.should.equal('');
					statusSet.should.equal(true);
					done();
				},
				status: (statusCode) => {
					statusCode.should.equal(204);
					statusSet = true;
				}
			});
		});
	});

	describe('promises', () => {
		it('should handle controllers that returns a promise', (done) => {
			const myController = {
				index: async (params, send) => {
					await new Promise((resolve) => {
						setTimeout(() => resolve(), 100);
					});

					send(goa.action());
				}
			};

			const app = goa.createApplication(
				(name, context, callback) => callback(null, myController),
				{ express }
			);
			const res = {
				set: () => {},
				send: () => done()
			};

			const next = () => done('next() should not have been called');
			app.middleware({controller: 'whatever', action: 'index'})({params: {}}, res, next);
		});

		it('should handle controllers that returns a rejected promise', (done) => {
			const myController = {
				index: async () => {
					throw new Error('sux');
				}
			};

			const app = goa.createApplication(
				(name, context, callback) => callback(null, myController),
				{express}
			);
			const res = {
				set: () => {}
			};

			const next = (err) => {
				err.should.have.property('message', 'sux');
				done();
			};
			app.middleware({controller: 'whatever', action: 'index'})({params: {}}, res, next);
		});

		it('should allow controller factory to return a promise', (done) => {
			const myController = {
				index: (params) => {
					params.should.eql({
						controller: 'whatever',
						action: 'index'
					});
					done();
				}
			};

			const app = goa.createApplication(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
				return myController;
			}, { express });

			const next = () => done('next() should not have been called');
			app.middleware({ controller: 'whatever', action: 'index' })({ params: {} }, {}, next);
		});

		it('should allow controller factory to return a rejected promise', (done) => {
			const app = goa.createApplication(async () => { throw new Error('fail'); }, {express});

			const next = (err) => {
				err.should.have.property('message', 'fail');
				done();
			};
			app.middleware({controller: 'whatever', action: 'index'})({params: {}}, {}, next);
		});

		it('should handle non-rejection exceptions when running action method', (done) => {
			const myController = {
				index: () => {
					throw new Error('sux');
				}
			};

			const app = goa.createApplication(
				(name, context, callback) => callback(null, myController),
				{express}
			);
			const res = {
				set: () => {}
			};

			const next = (err) => {
				err.should.have.property('message', 'sux');
				done();
			};
			app.middleware({controller: 'whatever', action: 'index'})({params: {}}, res, next);
		});

		it('should handle non-rejection exceptions when running unknown action method', (done) => {
			const myController = {
				handleUnknownAction: () => {
					throw new Error('sux');
				}
			};

			const app = goa.createApplication(
				(name, context, callback) => callback(null, myController),
				{express}
			);
			const res = {
				set: () => {}
			};

			const next = (err) => {
				err.should.have.property('message', 'sux');
				done();
			};
			app.middleware({controller: 'whatever', action: 'index'})({params: {}}, res, next);
		});
	});
});
