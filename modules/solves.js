"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolverEmbed = exports.getSolver = exports.getCurrentPbs = exports.SolveEntry = void 0;
const config_1 = require("../config");
const { FOOTER_STRING, SOLVES_PER_PAGE } = config_1.default;
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
            return null;
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
            return null;
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
            return null;
        }
        return this.solves.best;
    }
    pbString() {
        let pb = this.pb;
        if (pb === null) {
            return 'N/A';
        }
        return pb.toString();
    }
    lastSolveWasPb() {
        return (this.getLastSolve() !== null && this.getLastSolve().id == this.pb.id);
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
        let s = 0;
        for (let i = 1; i < cnt - 1; ++i) {
            s += a[i];
        }
        return Math.round(s / (cnt - 2));
    }
    _getBestAveragesString() {
        let lines = [];
        for (let i = 0; i < Solver.AVGS; ++i) {
            if (this.avg[i].empty()) {
                continue;
            }
            lines.push(`Over ${Solver.TRACKED_AVGS[i]}: `
                + `${timer.formatTime(this.avg[i].best, false)}`);
        }
        if (lines.length == 0) {
            lines.push('none');
        }
        return lines.join('\n');
    }
    _getCurrentAveragesString() {
        let lines = [];
        for (let i = 0; i < Solver.AVGS; ++i) {
            if (this.avg[i].empty()) {
                continue;
            }
            lines.push(`Over ${Solver.TRACKED_AVGS[i]}: `
                + `${timer.formatTime(this.avg[i].top(), false)}`);
        }
        if (lines.length == 0) {
            lines.push('none');
        }
        return lines.join('\n');
    }
    _getSolvesString(from, to) {
        if (!(0 <= from && from <= to && to < this.solves.size())) {
            console.error('tried to get solves in an invalid range');
            return null;
        }
        let res = '';
        for (let i = to; i >= from; i--) {
            if (i != to) {
                res += '\n';
            }
            res += `${i + 1}) ${this.solves.stk[i].toString()}`;
        }
        return res;
    }
    get numPages() {
        return 1 + Math.ceil(this.solves.size() / SOLVES_PER_PAGE);
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
                text: `${FOOTER_STRING} | Page 1/${this.numPages}`
            },
        };
    }
    getSolvesEmbed(page) {
        if (page < 0 || page >= this.numPages - 1) {
            return null;
        }
        let to = this.solves.size() - 1 - page * SOLVES_PER_PAGE;
        let from = Math.max(to - SOLVES_PER_PAGE + 1, 0);
        return {
            color: 0x0099ff,
            title: `User Profile`,
            description: `Discord User: <@${this.userId}>`,
            fields: [
                {
                    name: 'Solves (most recent solve first)',
                    value: this._getSolvesString(from, to),
                    inline: false,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: `${FOOTER_STRING} | Page ${page + 2}/${this.numPages}`
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
        let pb = solver.pb;
        if (pb !== null) {
            res.push(pb);
        }
    }
    return res;
}
exports.getCurrentPbs = getCurrentPbs;
function getSolver(userId) {
    if (!solvers.has(userId)) {
        console.log(`creating a Solver for the user with id ${userId}`);
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