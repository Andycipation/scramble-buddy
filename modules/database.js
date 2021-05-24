"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.popSolve = exports.togglePlusTwo = exports.deleteLog = exports.setMethod = exports.logSolve = exports.loadSolves = void 0;
const config_js_1 = require("../config.js");
const solves = require("./solves.js");
var channel;
function loadSolves(_channel) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('loading solve logs');
        channel = _channel;
        let lastId = undefined;
        let logMessages = [];
        while (logMessages.length < config_js_1.default.LOGS_TO_LOAD) {
            let messages = yield channel.messages.fetch({
                limit: Math.min(config_js_1.default.LOGS_TO_LOAD - logMessages.length, 100),
                before: lastId,
            });
            if (messages.size == 0) {
                break;
            }
            for (let message of messages.values()) {
                logMessages.push(message);
                lastId = message.id;
            }
        }
        logMessages.reverse();
        let solveLogs = 0;
        let methodLogs = 0;
        for (const message of logMessages) {
            let data = message.content.split('|');
            const userId = data[0];
            const solver = solves.getSolver(userId);
            if (data.length == 3) {
                let time = parseInt(data[1], 10);
                let plusTwo = data[1].endsWith('+');
                let scramble = data[2];
                const se = new solves.SolveEntry(message.id, userId, time, plusTwo, scramble, message.createdAt);
                solver.pushSolve(se);
                ++solveLogs;
            }
            else if (data.length == 2) {
                let method = data[1];
                solver.setMethod(method);
                solver.setMethodLogId(message.id);
                ++methodLogs;
            }
        }
        console.log(`loaded ${solveLogs} solve logs and ${methodLogs} method logs`);
    });
}
exports.loadSolves = loadSolves;
function logSolve(userId, time, scramble) {
    return __awaiter(this, void 0, void 0, function* () {
        const solver = solves.getSolver(userId);
        const se = new solves.SolveEntry('', userId, time, false, scramble, new Date(Date.now()));
        const id = yield _sendLog(se.logString());
        se.id = id;
        solver.pushSolve(se);
    });
}
exports.logSolve = logSolve;
function setMethod(userId, method) {
    return __awaiter(this, void 0, void 0, function* () {
        const solver = solves.getSolver(userId);
        if (!solver.setMethod(method)) {
            return false;
        }
        if (solver.methodLogId !== null) {
            deleteLog(solver.methodLogId);
        }
        const id = yield _sendLog(solver.methodLogString());
        solver.setMethodLogId(id);
        return true;
    });
}
exports.setMethod = setMethod;
function _sendLog(logString) {
    return __awaiter(this, void 0, void 0, function* () {
        const sent = yield channel.send(logString);
        return sent.id;
    });
}
function deleteLog(messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield channel.messages.fetch(messageId);
        if (!message.deletable) {
            console.error(`why is this message in the bot log not deletable? id: ${message.id}`);
            return false;
        }
        message.delete();
        return true;
    });
}
exports.deleteLog = deleteLog;
function togglePlusTwo(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const solver = solves.getSolver(userId);
        if (!solver.togglePlusTwo()) {
            return false;
        }
        const se = solver.getLastSolve();
        const message = yield channel.messages.fetch(se.id);
        if (!message.editable) {
            console.error(`why is this message in the bot log not editable? id: ${message.id}`);
            return false;
        }
        message.edit(se.logString());
        return true;
    });
}
exports.togglePlusTwo = togglePlusTwo;
function popSolve(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const solver = solves.getSolver(userId);
        const id = solver.popSolve();
        if (id === null) {
            return false;
        }
        return deleteLog(id);
    });
}
exports.popSolve = popSolve;
//# sourceMappingURL=database.js.map