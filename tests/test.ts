import * as goa from '../';
import * as express from 'express';

const app = goa((name, context, callback) => {
	callback(null, {
		index: () => {
			goa.json({}, { contentType: 'text/plain' });
		}
	});
}, { express });

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

app.listen(3000);
