var goa = require('./src/goa');

var results = require('./src/results');
goa.results = results;
goa.action = function(content, contentType) {
	return new results.ActionResult(content, contentType);
};
goa.json = function(json) {
	return new results.JsonResult(json);
};
goa.file = function(fileName, options) {
	return new results.FileResult(fileName, options);
};
goa.view = function(name, params) {
	return new results.ViewResult(name, params);
};
goa.error = function(err, statusCode) {
	return new results.ErrorResult(err, statusCode);
};
goa.redirect = function(url, statusCode) {
	return new results.RedirectResult(url, statusCode);
};

module.exports = goa;