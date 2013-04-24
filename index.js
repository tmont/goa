var goa = require('./src/goa');

var results = require('./src/results');
goa.results = results;
goa.action = function(content, contentType, options) {
	return new results.ActionResult(content, contentType, options);
};
goa.json = function(json, options) {
	return new results.JsonResult(json, options);
};
goa.file = function(fileName, options) {
	return new results.FileResult(fileName, options);
};
goa.view = function(name, params, options) {
	return new results.ViewResult(name, params, options);
};
goa.error = function(err, options) {
	return new results.ErrorResult(err, options);
};
goa.redirect = function(url, options) {
	return new results.RedirectResult(url, options);
};
goa.empty = function(contentType) {
	return new results.EmptyResult(contentType);
};

module.exports = goa;