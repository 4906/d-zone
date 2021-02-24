/// <reference types="node" />
import http from 'http';
import url from 'url';
/** Main function. Everything starts here. */
export declare function initServer(middlewareFactory: (devMode: boolean) => Promise<(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl?: url.UrlWithParsedQuery | undefined) => Promise<void>>): Promise<void>;
