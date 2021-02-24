"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.handleErrorProneFn = exports.handleError = void 0;
/**
 * Handle errors throughout App
 *
 * @param error - Error
 */
function handleError(error) {
    console.error(error);
    if (error instanceof AppError && error.isOperational)
        return;
    else
        process.exit(1);
}
exports.handleError = handleError;
/**
 * Wrap error-able async functions
 *
 * @param asyncFn - Function to be wrapped
 * @returns Error safe function proxy
 */
function handleErrorProneFn(asyncFn) {
    return (...args) => {
        asyncFn(...args).catch(handleError);
    };
}
exports.handleErrorProneFn = handleErrorProneFn;
/**
 * App Error - Used for representing internal errors
 *
 * @see {@link https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/useonlythebuiltinerror.md}
 */
class AppError extends Error {
    constructor(name, description, isOperational, cause) {
        super(description);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = name;
        this.isOperational = isOperational;
        this.cause = cause;
        // Works only on V8
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
