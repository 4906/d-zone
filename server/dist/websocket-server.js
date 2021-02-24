"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const ws_1 = require("ws");
const eventemitter3_1 = require("eventemitter3");
const error_1 = require("./utils/error");
/**
 * Thin wrapper around ws for better API.
 *
 * Emits error event with AppError Handles parsing of messages from and to
 * server Should handle heart-beating in next versions
 */
class WebSocketServer extends eventemitter3_1.EventEmitter {
    constructor(httpServer) {
        super();
        const webSocketServer = new ws_1.Server({ server: httpServer });
        webSocketServer.on('connection', (client) => {
            if (client.readyState === client.OPEN)
                this.emit('connectionOpen', client);
            else
                client.on('open', () => this.emit('connectionOpen', client));
            client.on('close', (...args) => this.emit('connectionClose', client, ...args));
            client.on('message', (data) => this.emit('message', client, JSON.parse(data.toString())));
            client.on('error', (error) => client.emit('error', new error_1.AppError('CLIENT_WS_ERROR', 'WS connection errored', true, error)));
        });
        webSocketServer.on('error', (error) => this.emit('error', new error_1.AppError('WS_SERVER_ERROR', 'Websocket server errored', false, error)));
    }
    sendMessage(client, message) {
        return new Promise((resolve, reject) => {
            if (client.readyState === client.OPEN)
                client.send(JSON.stringify(message), (error) => {
                    if (error)
                        reject(new error_1.AppError('WS_UNABLE_TO_SEND_MESSAGE', 'Unable to send message', true, error));
                    else
                        resolve();
                });
            else
                reject(new error_1.AppError('WS_CLIENT_NOT_OPEN', 'Client connection was not yet opened.', false));
        });
    }
}
exports.WebSocketServer = WebSocketServer;
