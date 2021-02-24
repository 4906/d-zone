"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientManager = void 0;
const error_1 = require("./utils/error");
class ClientManager {
    constructor(websocketServer, discordClient) {
        this.websocketServer = websocketServer;
        this.discordClient = discordClient;
        this.clients = new Map();
    }
    init() {
        this.websocketServer.on('connectionOpen', (client) => this.websocketOnConnectionOpen(client));
        this.websocketServer.on('connectionClose', (client, _, reason) => this.websocketOnConnectionClose(client, reason));
        this.websocketServer.on('message', error_1.handleErrorProneFn((client, message) => this.websocketOnClientMessage(client, message)));
        this.discordClient.on('messageCreate', error_1.handleErrorProneFn((message) => this.discordClientOnMessageCreate(message)));
    }
    websocketOnConnectionOpen(client) {
        console.log(`😺 New websocket connection - ${new Date().toLocaleString()}`);
        this.clients.set(client, {});
    }
    websocketOnConnectionClose(client, reason) {
        console.log(`🙀 Websocket connection closed - Reason: ${reason}`);
        this.clients.delete(client);
    }
    async websocketOnClientMessage(client, { name, event }) {
        if (name === 'JOIN')
            await this.handleServerJoin(event.guildId, client);
    }
    async discordClientOnMessageCreate({ content, guildID, author, }) {
        for (const [client, { guild }] of this.clients) {
            if (guild && guildID === guild.id)
                await this.websocketServer.sendMessage(client, {
                    name: 'MESSAGE',
                    event: {
                        message: content,
                        user: { username: author.username, id: author.id },
                    },
                });
        }
    }
    async handleServerJoin(id, client) {
        const guild = this.discordClient.guilds.get(id);
        if (guild) {
            this.clients.set(client, { guild });
            await this.websocketServer.sendMessage(client, {
                name: 'JOIN_SUCCESS',
                event: {
                    users: guild.members.map(({ id, username }) => ({ id, username })),
                    server: { id },
                },
            });
        }
        else
            await this.websocketServer.sendMessage(client, {
                name: 'JOIN_ERROR',
                event: { error: 'SERVER_NOT_FOUND' },
            });
    }
}
exports.ClientManager = ClientManager;
