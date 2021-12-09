import * as express from 'express';
import {PathParams, RequestHandlerParams} from 'express-serve-static-core';

declare namespace goa {

	interface Goa {
		createApplication<TNames = string>(
			controllerFactory: (
				name: TNames,
				context: ControllerContext,
				callback: (err: any | null, controller: any) => void
			) => void,
			options: GoaOptions
		): GoaApplication;

		createApplication<TNames = string>(
			controllerFactory: (name: TNames, context: ControllerContext) => Promise<any>,
			options: GoaOptions
		): GoaApplication;

		parseRequest<T = any>(req: express.Request, params: ActionParams<T>): any

		action(content?: string, contentType?: string, options?: ResultOptions | number): ActionResult;

		empty(contentType?: string): EmptyResult;

		json(json: any, options?: ResultOptions | number): JsonResult;

		file(file: string, options?: ResultOptions | number): FileResult;

		view<TViews = string>(viewName: TViews, params?: any | (() => any), options?: ResultOptions | number): ViewResult;

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

	export type GoaRequestHandler = express.RequestHandler | { controller: string, action: string }
	export type GoaRequestHandlerParams =
		RequestHandlerParams
		| { controller: string, action?: string, [key: string]: any }

	export interface GoaRouterMatcher<T> {
		(path: PathParams, ...handlers: GoaRequestHandler[]): T;

		(path: PathParams, ...handlers: GoaRequestHandlerParams[]): T;
	}

	export interface GoaApplication extends express.Application {
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

	export interface ResultOptions {
		status?: number
		contentType?: string
	}

	export interface ControllerContext {
		req: express.Request;
		res: express.Response;
		next: express.NextFunction;
	}

	export interface GoaOptions {
		express: () => express.Application;
		defaultAction?: string
	}

	export type ResultExecuteNextFunction = (err?: any, str?: string) => void;

	export interface Result {
		execute(res: express.Response, next?: ResultExecuteNextFunction): void;
	}

	export interface ActionResult extends Result {
		new(content?: string, contentType?: string, options?: ResultOptions | number): this;
	}

	export interface EmptyResult extends ActionResult {
		new(contentType?: string): this;
	}

	export interface ErrorResult extends Result {
		(err?: any, options?: ResultOptions | number): this;
	}

	export interface JsonResult extends ActionResult {
		new(json: any, options?: ResultOptions | number): this;
	}

	export interface RedirectResult extends Result {
		new(url: string, options?: ResultOptions | number): this;
	}

	export interface ViewResult extends Result {
		new(viewName: string, params?: () => any | any, options?: ResultOptions | number): this;
	}

	export interface FileResult extends Result {
		new(file: string, options?: ResultOptions | number): this;
	}

	interface ActionParamsStatic {
		readonly controller: string;
		readonly action: string;
	}

	export type ActionParams<TParams> = ActionParamsStatic & {
		[P in keyof TParams]: TParams[P];
	};

	export type Send = (result: Result, onComplete?: () => (void | Promise<void>)) => void;
}

declare const goa: goa.Goa;

export = goa;
