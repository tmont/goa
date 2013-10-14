var util = require('util'),
	http = require('http'),
	https = require('https');

function applyCommonOptions(res, options) {
	if (options.status) {
		res.status(options.status);
	}
}

function createOptions(options, defaultStatus) {
	var newOptions = typeof(options) === 'number' ? { status: options } : (options || {});
	if (defaultStatus && !newOptions.status) {
		newOptions.status = defaultStatus;
	}

	return newOptions;
}

function ActionResult(content, contentType, options) {
	if (content) {
		this.content = content;
	}
	if (contentType) {
		this.contentType = contentType;
	}
	this.options = createOptions(options);
}
ActionResult.prototype = {
	contentType: 'text/plain',
	content: '',
	execute: function(res) {
		if (this.contentType) {
			res.set('Content-Type', this.contentType);
		}

		applyCommonOptions(res, this.options);

		res.send(this.content);
	}
};

function EmptyResult(contentType) {
	ActionResult.call(this, '', contentType, { status: 204 });
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

	if (this.options.fileName) {
		//if it's a URL, we need to pipe it manually
		var match = /^(\w+):\/\//.exec(this.file);
		if (match) {
			var fileName = this.options.fileName;
			res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
			function pipe(httpRes) {
				res.statusCode = httpRes.statusCode;
				httpRes.pipe(res);
			}
			if (match[1] === 'https') {
				https.get(this.file, pipe);
			} else {
				http.get(this.file, pipe);
			}
			return;
		}

		res.download(this.file, this.options.fileName);
		return;
	}

	res.sendfile(this.file, this.options);
};

function ViewResult(viewName, params, options) {
	this.view = viewName;
	this.params = params;
	this.options = createOptions(options);
}

ViewResult.prototype.execute = function(res) {
	applyCommonOptions(res, this.options);
	res.render(this.view, this.params);
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
