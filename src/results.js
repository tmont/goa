const http = require('http');
const https = require('https');

const applyCommonOptions = (res, options) => {
	if (options.status) {
		res.status(options.status);
	}
	if (options.contentType) {
		res.set('Content-Type', options.contentType);
	}
};

const createOptions = (options, defaultStatus) => {
	const newOptions = typeof(options) === 'number' ? {status: options} : (options || {});
	if (defaultStatus && !newOptions.status) {
		newOptions.status = defaultStatus;
	}

	return newOptions;
};

class ActionResult {
	constructor(content, contentType, options) {
		this.content = content || '';
		options = options || {};
		this.options = createOptions(options);
		this.options.contentType = contentType || 'text/plain';
	}

	execute(res) {
		applyCommonOptions(res, this.options);
		res.send(this.content);
	}
}

class EmptyResult extends ActionResult {
	constructor(contentType) {
		super('', contentType, { status: 204 });
	}
}

class JsonResult extends ActionResult {
	constructor(json, options) {
		super(json, 'application/json', options);
	}
}

class FileResult {
	constructor(file, options) {
		this.file = file;
		this.options = createOptions(options);
	}

	execute(res) {
		applyCommonOptions(res, this.options);

		const fileName = this.options.fileName;
		const externalMatch = /^(\w+):\/\//.exec(this.file);

		//if it's a URL, we need to pipe it manually
		if (externalMatch) {
			const pipe = (httpRes) => {
				res.statusCode = httpRes.statusCode;
				if (fileName) {
					res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
				}
				httpRes.pipe(res);
			};

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
	}
}

class ViewResult {
	constructor(viewName, params, options) {
		this.view = viewName;
		this.params = typeof(params) === 'function' ? params() : params;
		this.options = createOptions(options);
	}

	execute(res, next) {
		applyCommonOptions(res, this.options);
		res.render(this.view, this.params, next);
	}
}

class ErrorResult {
	constructor(err, options) {
		this.error = err || new Error('An error occurred');
		this.options = createOptions(options, 500);
	}

	execute(res, next) {
		applyCommonOptions(res, this.options);
		next(this.error);
	}
}

class RedirectResult {
	constructor(url, options) {
		this.url = url;
		this.options = createOptions(options, 302);
	}

	execute(res) {
		applyCommonOptions(res, this.options);
		res.redirect(this.options.status, this.url);
	}
}

module.exports = {
	ActionResult,
	EmptyResult,
	JsonResult,
	FileResult,
	ViewResult,
	ErrorResult,
	RedirectResult
};
