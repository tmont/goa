var util = require('util');

function applyCommonOptions(res, options) {
	if (options.status) {
		res.status(options.status);
	}
}

function ActionResult(content, contentType, options) {
	if (content) {
		this.content = content;
	}
	if (contentType) {
		this.contentType = contentType;
	}

	this.options = options || {};
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

function JsonResult(json, options) {
	ActionResult.call(this, json, 'application/json', options);
}
util.inherits(JsonResult, ActionResult);

function FileResult(file, options) {
	this.file = file;
	this.options = options || {};
}

FileResult.prototype.execute = function(res) {
	applyCommonOptions(res, this.options);

	if (this.options.fileName) {
		res.download(this.file, this.options.fileName);
		return;
	}

	res.sendfile(this.file, this.options);
};

function ViewResult(viewName, params, options) {
	this.view = viewName;
	this.params = params;
	this.options = options || {};
}

ViewResult.prototype.execute = function(res) {
	applyCommonOptions(res, this.options);
	res.render(this.view, this.params);
};

function ErrorResult(err, options) {
	this.error = err || new Error('An error occurred');
	this.options = typeof(options) !== 'object' ? {} : (options || {});
	if (!this.options.status) {
		this.options.status = typeof(options) === 'number' ? options : 500;
	}
}
ErrorResult.prototype.execute = function(res, next) {
	applyCommonOptions(res, this.options);
	next(this.error);
};

function RedirectResult(url, options) {
	this.url = url;
	this.options = typeof(options) !== 'object' ? {} : (options || {});
	if (!this.options.status) {
		this.options.status = typeof(options) === 'number' ? options : 302;
	}
}
RedirectResult.prototype.execute = function(res) {
	applyCommonOptions(res, this.options);
	res.redirect(this.options.status, this.url);
};

module.exports = {
	ActionResult: ActionResult,
	JsonResult: JsonResult,
	FileResult: FileResult,
	ViewResult: ViewResult,
	ErrorResult: ErrorResult,
	RedirectResult: RedirectResult
};
