/// <reference types="node" />
import { InspectOptions } from 'util';
export declare type Loggable = string | boolean | number | undefined | null | unknown[] | Record<string, unknown>;
export declare class Logger {
    readonly name: string;
    private readonly parent?;
    constructor(name: string, parent?: Logger | undefined);
    log(message: Loggable, options?: InspectOptions): string | Date;
    error(error: Error): string | Date;
    getFormattedName(): string;
    private date;
    private group;
}
