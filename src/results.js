var util = require('util');

function ActionResult(content, contentType) {
	if (content) {
		this.content = content;
	}
	if (contentType) {
		this.contentType = contentType;
	}
}
ActionResult.prototype = {
	contentType: 'text/plain',
	content: '',
	execute: function(res) {
		if (this.contentType) {
			res.set('Content-Type', this.contentType);
		}

		res.send(this.content);
	}
};

function JsonResult(json) {
	ActionResult.call(this, json, 'application/json');
}
util.inherits(JsonResult, ActionResult);

function FileResult(file, options) {
	this.file = file;
	this.options = options || {};
}

FileResult.prototype.execute = function(res) {
	if (this.options.fileName) {
		res.download(this.file, this.options.fileName);
		return;
	}

	res.sendfile(this.file, this.options);
};

function ViewResult(viewName, params) {
	this.view = viewName;
	this.params = params;
}

ViewResult.prototype.execute = function(res) {
	res.render(this.view, this.params);
};

function ErrorResult(err, statusCode) {
	this.error = err || new Error('An error occurred');
	this.statusCode = statusCode || 500;
}
ErrorResult.prototype.execute = function(res, next) {
	if (this.statusCode) {
		res.status(this.statusCode);
	}

	next(this.error);
};

function RedirectResult(url, statusCode) {
	this.url = url;
	this.statusCode = statusCode || 302;
}
RedirectResult.prototype.execute = function(res) {
	res.redirect(this.statusCode, this.url);
};

module.exports = {
	ActionResult: ActionResult,
	JsonResult: JsonResult,
	FileResult: FileResult,
	ViewResult: ViewResult,
	ErrorResult: ErrorResult,
	RedirectResult: RedirectResult
};
