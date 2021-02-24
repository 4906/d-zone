"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const util_1 = require("util");
// To keep track of last log
const consoleStack = [];
class Logger {
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
    }
    log(message, options = { depth: 10 }) {
        const [time, timeStr] = this.date();
        this.group();
        const stringifiedMessage = typeof message === 'object'
            ? util_1.inspect(message, options)
            : message !== undefined
                ? message.toString()
                : 'undefined';
        console.log(timeStr, 'INFO', stringifiedMessage);
        // Push to stack
        consoleStack.unshift(this);
        return time;
    }
    error(error) {
        const [time, timeStr] = this.date();
        this.group();
        console.error(timeStr, 'ERROR', error);
        // Push to stack
        consoleStack.unshift(this);
        return time;
    }
    getFormattedName() {
        if (this.parent)
            return `${this.parent.getFormattedName()} > ${this.name} `;
        else
            return this.name + ' ';
    }
    date() {
        const time = new Date();
        return [time, time.toLocaleTimeString()];
    }
    group() {
        if (consoleStack.shift() !== this) {
            console.groupEnd();
            console.group(this.getFormattedName());
        }
    }
}
exports.Logger = Logger;
