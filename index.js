const { createApplication, parseRequest } = require('./src/goa');
const goa = {};

const results = require('./src/results');
goa.results = results;
goa.action = (content, contentType, options) => {
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

module.exports = {
	createApplication,
	parseRequest,
	results,
	action: (content, contentType, options) => new results.ActionResult(content, contentType, options),
	json: (json, options) => new results.JsonResult(json, options),
	file: (fileName, options) => new results.FileResult(fileName, options),
	view: (name, params, options) => new results.ViewResult(name, params, options),
	error: (err, options) => new results.ErrorResult(err, options),
	redirect: (url, options) => new results.RedirectResult(url, options),
	empty: (contentType) =>  new results.EmptyResult(contentType)
};
