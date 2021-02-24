/**
 * Handle errors throughout App
 *
 * @param error - Error
 */
export declare function handleError(error: Error): void;
/**
 * Wrap error-able async functions
 *
 * @param asyncFn - Function to be wrapped
 * @returns Error safe function proxy
 */
export declare function handleErrorProneFn<A extends unknown[], T extends (...args: A) => Promise<unknown>>(asyncFn: T): (...args: A) => void;
/**
 * App Error - Used for representing internal errors
 *
 * @see {@link https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/useonlythebuiltinerror.md}
 */
export declare class AppError extends Error {
    readonly name: string;
    readonly isOperational: boolean;
    readonly cause?: Error;
    constructor(name: string, description: string, isOperational: boolean, cause?: Error);
}
