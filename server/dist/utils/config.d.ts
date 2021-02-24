import 'dotenv/config';
import * as z from 'zod';
import { OnlyKeys } from '../typings/util';
declare const schema: z.ZodObject<{
    discord: z.ZodObject<{
        token: z.ZodString;
    }, {
        strict: true;
    }, {
        token: string;
    }>;
    port: z.ZodNumber;
    dev: z.ZodBoolean;
}, {
    strict: true;
}, {
    discord: {
        token: string;
    };
    port: number;
    dev: boolean;
}>;
/** Parsed configuration */
export declare type Config = z.infer<typeof schema>;
/**
 * Parse configuration
 *
 * @param config - Configuration to be parsed
 * @returns Parsed configuration
 */
export declare function parseConfig(config: OnlyKeys<Config>): Config;
export {};
