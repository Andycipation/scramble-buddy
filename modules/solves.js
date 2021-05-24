"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolverEmbed = exports.getSolver = exports.getCurrentPbs = exports.SolveEntry = void 0;
const config_1 = require("../config");
const stack_js_1 = require("./stack.js");
const timer = require("./timer.js");
class SolveEntry {
    constructor(id, userId, time, plusTwo, scramble, completed) {
        this.id = id;
        this.userId = userId;
        this.time = time;
        this.plusTwo = plusTwo;
        this.scramble = scramble;
        this.completed = completed;
    }
    toString() {
        return `${timer.formatTime(this.time, this.plusTwo)} **|** ${this.scramble}`;
    }
    logString() {
        let timeString = `${this.time}`;
        if (this.plusTwo) {
            timeString += '+';
        }
        return `${this.userId}|${timeString}|${this.scramble}`;
    }
    togglePlusTwo() {
        if (!this.plusTwo) {
            this.time += 2000;
            this.plusTwo = true;
        }
        else {
            this.time -= 2000;
            this.plusTwo = false;
        }
    }
}
exports.SolveEntry = SolveEntry;
class Solver {
    constructor(userId) {
        this.userId = userId;
        this.method = 'unspecified';
        this.methodLogId = null;
        this.solves = new stack_js_1.Stack((se1, se2) => (se1.time <= se2.time), (se1, se2) => (se1.id == se2.id));
        this.psa = [0];
        this.avg = Array(Solver.AVGS);
        for (let i = 0; i < Solver.AVGS; ++i) {
            this.avg[i] = new stack_js_1.MinStack();
        }
    }
    setMethod(method) {
        if (method.includes('|')) {
            return false;
        }
        this.method = method;
        return true;
    }
    setMethodLogId(methodLogId) {
        this.methodLogId = methodLogId;
    }
    methodLogString() {
        return `${this.userId}|${this.method}`;
    }
    pushSolve(se) {
        this.psa.push(this.psa[this.solves.size()] + se.time);
        this.solves.push(se);
        for (let i = 0; i < Solver.AVGS; ++i) {
            let a = this.getAverage(Solver.TRACKED_AVGS[i]);
            if (a != -1) {
                this.avg[i].push(a);
            }
        }
    }
    getLastSolve() {
        if (this.solves.empty()) {
            throw "tried to get the last solve of a Solver with no SolveEntry";
        }
        return this.solves.top();
    }
    togglePlusTwo() {
        if (this.solves.empty()) {
            return false;
        }
        let se = this.solves.top();
        this.solves.pop();
        for (let i = 0; i < Solver.AVGS; ++i) {
            if (!this.avg[i].empty()) {
                this.avg[i].pop();
            }
        }
        se.togglePlusTwo();
        this.pushSolve(se);
        return true;
    }
    popSolve() {
        if (this.solves.empty()) {
            throw "tried to pop a solve from a Solver with no SolveEntry";
        }
        const removedId = this.solves.top().id;
        this.solves.pop();
        for (let i = 0; i < Solver.AVGS; ++i) {
            if (!this.avg[i].empty()) {
                this.avg[i].pop();
            }
        }
        return removedId;
    }
    get pb() {
        if (this.solves.empty()) {
            throw 'tried to get PB of a Solver with no SolveEntry';
        }
        return this.solves.best;
    }
    pbString() {
        if (this.solves.empty()) {
            return 'N/A';
        }
        return this.pb.toString();
    }
    lastSolveWasPb() {
        var _a;
        return (this.getLastSolve() && this.getLastSolve().id == ((_a = this.pb) === null || _a === void 0 ? void 0 : _a.id));
    }
    getAverage(cnt) {
        let n = this.solves.size();
        if (cnt <= 2 || cnt > n) {
            return -1;
        }
        let a = [];
        for (let i = n - cnt; i < n; ++i) {
            a.push(this.solves.stk[i].time);
        }
        a.sort((x, y) => {
            if (x < y)
                return -1;
            if (x > y)
                return 1;
            return 0;
        });
        let sum = 0;
        for (let i = 1; i < cnt - 1; ++i) {
            sum += a[i];
        }
        return Math.round(sum / (cnt - 2));
    }
    _getAveragesString(func) {
        const lines = [];
        for (let i = 0; i < Solver.AVGS; ++i) {
            if (this.avg[i].empty()) {
                continue;
            }
            const toAdd = func(this.avg[i]);
            lines.push(`Over ${Solver.TRACKED_AVGS[i]}: ${timer.formatTime(toAdd, false)}`);
        }
        if (lines.length == 0) {
            lines.push('none');
        }
        return lines.join('\n');
    }
    _getBestAveragesString() {
        return this._getAveragesString((avgStack) => {
            return avgStack.best;
        });
    }
    _getCurrentAveragesString() {
        return this._getAveragesString((avgStack) => {
            return avgStack.top();
        });
    }
    _getSolvesString(from, to) {
        if (!(0 <= from && from <= to && to < this.solves.size())) {
            throw 'tried to get solves in an invalid range';
        }
        const strings = [];
        for (let i = to; i >= from; i--) {
            strings.push(`${i + 1}) ${this.solves.stk[i].toString()}`);
        }
        return strings.join('\n');
    }
    get numPages() {
        return 1 + Math.ceil(this.solves.size() / config_1.default.SOLVES_PER_PAGE);
    }
    getProfileEmbed() {
        return {
            color: 0x0099ff,
            title: `User Profile`,
            description: `Discord User: <@${this.userId}>`,
            fields: [
                {
                    name: 'Solving Method',
                    value: this.method,
                    inline: true,
                },
                {
                    name: 'Number of Solves',
                    value: this.solves.size(),
                    inline: true,
                },
                {
                    name: 'Personal Best',
                    value: this.pbString(),
                },
                {
                    name: 'Best Averages',
                    value: this._getBestAveragesString(),
                    inline: true,
                },
                {
                    name: 'Current Averages',
                    value: this._getCurrentAveragesString(),
                    inline: true,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: `${config_1.default.FOOTER_STRING} | Page 1/${this.numPages}`
            },
        };
    }
    getSolvesEmbed(page) {
        if (page < 0 || page >= this.numPages - 1) {
            return null;
        }
        let to = this.solves.size() - 1 - page * config_1.default.SOLVES_PER_PAGE;
        let from = Math.max(to - config_1.default.SOLVES_PER_PAGE + 1, 0);
        return {
            color: 0x0099ff,
            title: `User Profile`,
            description: `Discord User: <@${this.userId}>`,
            fields: [
                {
                    name: 'Solves (most recent solve first)',
                    value: this._getSolvesString(from, to),
                },
            ],
            timestamp: new Date(),
            footer: {
                text: `${config_1.default.FOOTER_STRING} | Page ${page + 2}/${this.numPages}`
            },
        };
    }
}
Solver.AVGS = 3;
Solver.TRACKED_AVGS = [5, 12, 100];
const solvers = new Map();
function getCurrentPbs() {
    let res = [];
    for (let solver of solvers.values()) {
        if (!solver.solves.empty()) {
            res.push(solver.pb);
        }
    }
    return res;
}
exports.getCurrentPbs = getCurrentPbs;
function getSolver(userId) {
    if (!solvers.has(userId)) {
        solvers.set(userId, new Solver(userId));
    }
    return solvers.get(userId);
}
exports.getSolver = getSolver;
function getSolverEmbed(userId, page) {
    const solver = getSolver(userId);
    if (page == 0) {
        return solver.getProfileEmbed();
    }
    return solver.getSolvesEmbed(page - 1);
}
exports.getSolverEmbed = getSolverEmbed;
//# sourceMappingURL=solves.js.map