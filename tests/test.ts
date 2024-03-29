import * as express from 'express';
import * as goa from '../index';

interface IndexParams {
	id: number;
	format: 'json' | 'xml';
}

const shouldNeverHappen = (x: never) => {};

const app: goa.GoaApplication = goa.createApplication((name, context, callback) => {
	callback(null, {
		index: (params: goa.ActionParams<IndexParams>, send: goa.Send) => {
			switch (params.format) {
				case 'json':
					send(goa.json({ ...params }, { contentType: 'text/plain' }));
					break;
				case 'xml':
					send(goa.action(`<id>${params.id}</id>`, 'text/xml'));
					break;
				default:
					shouldNeverHappen(params.format);
					send(goa.error(`Invalid format: ${params.format}`, 400));
					break;
			}
		},

		onComplete: (params: goa.ActionParams<any>, send: goa.Send) => {
			send(goa.action(), (): void => {
				console.log('on complete');
			});
		},

		onCompletePromise: (params: goa.ActionParams<any>, send: goa.Send) => {
			send(goa.action(), async (): Promise<void> => {
				console.log('on complete w/ promise');
			});
		}
	});
}, { express });

const app2 = goa.createApplication(async (name, context) => ({}), { express });

app.get('foo', { controller: 'Foo' });
app.post('foo', { controller: 'Foo', action: 'bar' });
app.put('foo', { controller: 'Foo', action: 'bar' });
app.patch('foo', { controller: 'Foo', action: 'bar' });
app.del('foo', { controller: 'Foo', action: 'bar' });
app.delete('foo', { controller: 'Foo', action: 'bar' });

const value = app.get('foo');
console.log(value);

app.use((req, res, next) => {
	next();
});

app.set('views', 'foo/bar').set('lol', 'wut');

goa.view('lol', {
	hello: 'world'
});
goa.view('lol', () => {
	return {
		hello: 'world'
	}
});
goa.empty('text/plain');
goa.action('hello world', 'text/plain', 400);
goa.action('hello world', 'text/plain', { status: 400 });

app.listen(3000);
