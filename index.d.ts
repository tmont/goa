import * as express from 'express';
import {PathParams, RequestHandler, RequestHandlerParams} from 'express-serve-static-core';

type GoaRequestHandler = RequestHandler | { controller: string, action: string }
type GoaRequestHandlerParams = RequestHandlerParams | { controller: string, action?: string, [key: string]: any }

interface GoaRouterMatcher<T> {
	(path: PathParams, ...handlers: GoaRequestHandler[]): T;
	(path: PathParams, ...handlers: GoaRequestHandlerParams[]): T;
}

interface GoaApplication extends express.Application {
	all: GoaRouterMatcher<this>;
	get: GoaRouterMatcher<this>;
	post: GoaRouterMatcher<this>;
	put: GoaRouterMatcher<this>;
	delete: GoaRouterMatcher<this>;
	del: GoaRouterMatcher<this>;
	patch: GoaRouterMatcher<this>;
	options: GoaRouterMatcher<this>;
	head: GoaRouterMatcher<this>;

	checkout: GoaRouterMatcher<this>;
	connect: GoaRouterMatcher<this>;
	copy: GoaRouterMatcher<this>;
	lock: GoaRouterMatcher<this>;
	merge: GoaRouterMatcher<this>;
	mkactivity: GoaRouterMatcher<this>;
	mkcol: GoaRouterMatcher<this>;
	move: GoaRouterMatcher<this>;
	"m-search": GoaRouterMatcher<this>;
	notify: GoaRouterMatcher<this>;
	propfind: GoaRouterMatcher<this>;
	proppatch: GoaRouterMatcher<this>;
	purge: GoaRouterMatcher<this>;
	report: GoaRouterMatcher<this>;
	search: GoaRouterMatcher<this>;
	subscribe: GoaRouterMatcher<this>;
	trace: GoaRouterMatcher<this>;
	unlock: GoaRouterMatcher<this>;
	unsubscribe: GoaRouterMatcher<this>;
}

interface ResultOptions {
	status?: number
	contentType?: string
}

interface ControllerContext {
	req: express.Request;
	res: express.Response;
	next: express.NextFunction;
}
interface GoaOptions {
	express: () => express.Application;
	defaultAction?: string
}

interface Result {
	execute(res: express.Response, next: express.NextFunction): void;
}

interface ActionResult extends Result {
	new(content?: string, contentType?: string, options?: ResultOptions | number): this;
}
interface EmptyResult extends ActionResult {
	new(contentType?: string): this;
}
interface ErrorResult extends Result {
	(err?: any, options?: ResultOptions | number): this;
}
interface JsonResult extends ActionResult {
	new(json: any, options?: ResultOptions | number): this;
}
interface RedirectResult extends Result {
	new(url: string, options?: ResultOptions | number): this;
}

interface ViewResult extends Result {
	new(viewName: string, params?: () => any | any, options?: ResultOptions | number): this;
}

interface FileResult extends Result {
	new(file: string, options?: ResultOptions | number): this;
}

interface ActionParams {
	readonly controller: string;
	readonly action: string;
}

interface goa {
	(
		controllerFactory: (
			name: string,
			context: ControllerContext,
			callback: (err: any | null, controller: any) => void
		) => void,
	    options: GoaOptions
	): GoaApplication;

	parseRequest(req: express.Request, params: ActionParams): any

	action(content?: string, contentType?: string, options?: ResultOptions | number): ActionResult;
	empty(contentType?: string): EmptyResult;
	json(json: any, options?: ResultOptions | number): JsonResult;
	file(file: string, options?: ResultOptions | number): FileResult;
	view(viewName: string, params?: () => any | any, options?: ResultOptions | number): ViewResult;
	error(err?: any, options?: ResultOptions | number): ErrorResult;
	redirect(url: string, options?: ResultOptions | number): RedirectResult;

	readonly results: {
		readonly ActionResult: ActionResult
		readonly EmptyResult: EmptyResult
		readonly JsonResult: JsonResult
		readonly FileResult: FileResult
		readonly ViewResult: ViewResult
		readonly ErrorResult: ErrorResult
		readonly RedirectResult: RedirectResult
	}
}

declare const goa: goa;

export = goa;
