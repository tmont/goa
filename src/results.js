var util = require('util'),
	http = require('http'),
	https = require('https');

function applyCommonOptions(res, options) {
	if (options.status) {
		res.status(options.status);
	}
	if (options.contentType) {
		res.set('Content-Type', options.contentType);
	}
}

function createOptions(options, defaultStatus) {
	var newOptions = typeof(options) === 'number' ? {status: options} : (options || {});
	if (defaultStatus && !newOptions.status) {
		newOptions.status = defaultStatus;
	}

	return newOptions;
}

function ActionResult(content, contentType, options) {
	if (content) {
		this.content = content;
	}
	options = options || {};
	options.contentType = contentType || 'text/plain';
	this.options = createOptions(options);
}
ActionResult.prototype = {
	content: '',
	execute: function(res) {
		applyCommonOptions(res, this.options);
		res.send(this.content);
	}
};

function EmptyResult(contentType) {
	ActionResult.call(this, '', contentType, {status: 204});
}
util.inherits(EmptyResult, ActionResult);

function JsonResult(json, options) {
	ActionResult.call(this, json, 'application/json', options);
}
util.inherits(JsonResult, ActionResult);

function FileResult(file, options) {
	this.file = file;
	this.options = createOptions(options);
}

FileResult.prototype.execute = function(res) {
	applyCommonOptions(res, this.options);

	var fileName = this.options.fileName,
		externalMatch = /^(\w+):\/\//.exec(this.file);

	//if it's a URL, we need to pipe it manually
	if (externalMatch) {
		function pipe(httpRes) {
			res.statusCode = httpRes.statusCode;
			if (fileName) {
				res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
			}
			httpRes.pipe(res);
		}

		if (externalMatch[1] === 'https') {
			https.get(this.file, pipe);
		} else {
			http.get(this.file, pipe);
		}
	} else if (fileName) {
		res.download(this.file, fileName);
	} else {
		res.sendFile(this.file, this.options);
	}
};

function ViewResult(viewName, params, options) {
	this.view = viewName;
	this.params = typeof(params) === 'function' ? params() : params;
	this.options = createOptions(options);
}

ViewResult.prototype.execute = function(res, next) {
	applyCommonOptions(res, this.options);
	res.render(this.view, this.params, next);
};

function ErrorResult(err, options) {
	this.error = err || new Error('An error occurred');
	this.options = createOptions(options, 500);
}
ErrorResult.prototype.execute = function(res, next) {
	applyCommonOptions(res, this.options);
	next(this.error);
};

function RedirectResult(url, options) {
	this.url = url;
	this.options = createOptions(options, 302);
}
RedirectResult.prototype.execute = function(res) {
	applyCommonOptions(res, this.options);
	res.redirect(this.options.status, this.url);
};

module.exports = {
	ActionResult: ActionResult,
	EmptyResult: EmptyResult,
	JsonResult: JsonResult,
	FileResult: FileResult,
	ViewResult: ViewResult,
	ErrorResult: ErrorResult,
	RedirectResult: RedirectResult
};
