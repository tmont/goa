var goa = require('./src/goa');

var results = require('./src/results');
for (var name in results) {
	goa[name] = results[name];
}

module.exports = goa;