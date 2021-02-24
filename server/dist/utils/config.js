"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConfig = void 0;
require("dotenv/config");
const z = __importStar(require("zod"));
const schema = z.object({
    discord: z.object({
        token: z.string(),
    }),
    port: z.number(),
    dev: z.boolean(),
});
/**
 * Parse configuration
 *
 * @param config - Configuration to be parsed
 * @returns Parsed configuration
 */
function parseConfig(config) {
    return schema.parse(config);
}
exports.parseConfig = parseConfig;
// {
// 	discordClientToken: process.env.DISCORD_CLIENT_TOKEN,
// 	port: parseInt(process.env.PORT || '3000', 10),
// 	dev: process.env.NODE_ENV !== 'production',
// }
