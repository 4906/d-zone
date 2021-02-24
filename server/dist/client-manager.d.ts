import discord from 'eris';
import { IClientPayload, IServerPayload } from './typings/payload';
import { WebSocketServer } from './websocket-server';
export declare class ClientManager {
    private readonly websocketServer;
    private readonly discordClient;
    private clients;
    constructor(websocketServer: WebSocketServer<IServerPayload, IClientPayload>, discordClient: discord.Client);
    init(): void;
    private websocketOnConnectionOpen;
    private websocketOnConnectionClose;
    private websocketOnClientMessage;
    private discordClientOnMessageCreate;
    private handleServerJoin;
}
