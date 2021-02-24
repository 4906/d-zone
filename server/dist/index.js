"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = void 0;
const http_1 = require("http");
const eris_1 = __importDefault(require("eris"));
const config_1 = require("./utils/config");
const error_1 = require("./utils/error");
const logger_1 = require("./utils/logger");
const client_manager_1 = require("./client-manager");
const websocket_server_1 = require("./websocket-server");
/** Main function. Everything starts here. */
async function initServer(middlewareFactory) {
    const mainLogger = new logger_1.Logger('❄️ MAIN');
    // Get the configuration
    const config = config_1.parseConfig({
        dev: process.env.NODE_ENV !== 'production',
        discord: { token: process.env.DISCORD_CLIENT_TOKEN },
        port: parseInt(process.env.PORT || '3000'),
    });
    // Create servers and discord client
    const middleware = await middlewareFactory(config.dev);
    const httpServer = http_1.createServer(middleware);
    const wsServer = new websocket_server_1.WebSocketServer(httpServer);
    const discordClient = new eris_1.default.Client(config.discord.token);
    // Client manager
    // Manages clients
    // While handling websocket and discord client communication
    const clientManager = new client_manager_1.ClientManager(wsServer, discordClient);
    // Error handlers
    httpServer.on('error', error_1.handleError);
    wsServer.on('error', error_1.handleError);
    discordClient.on('error', error_1.handleError);
    // Start only once discord client is ready
    discordClient.on('ready', () => {
        mainLogger.log(`Connected as ${discordClient.user.username} on ${discordClient.guilds.size} servers`);
        // If this is discord reconnecting, do not listen & init again
        if (!httpServer.listening) {
            httpServer.listen(config.port);
            mainLogger.log(`Listening on ${config.port}`);
            clientManager.init();
        }
    });
    // Start discord client
    // Once it is connected it starts server too
    await discordClient.connect();
}
exports.initServer = initServer;
