/// <reference types="node" />
import ws from 'ws';
import { Server as HTTPServer } from 'http';
import { EventEmitter } from 'eventemitter3';
import { AppError } from './utils/error';
export interface WebSocketServerEvents<ClientPayload> {
    connectionOpen: [ws];
    connectionClose: [ws, number, string];
    error: [AppError];
    message: [ws, ClientPayload];
}
/**
 * Thin wrapper around ws for better API.
 *
 * Emits error event with AppError Handles parsing of messages from and to
 * server Should handle heart-beating in next versions
 */
export declare class WebSocketServer<ServerPayload extends unknown, ClientPayload extends unknown> extends EventEmitter<WebSocketServerEvents<ClientPayload>> {
    constructor(httpServer: HTTPServer);
    sendMessage(client: ws, message: ServerPayload): Promise<void>;
}
