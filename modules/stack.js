"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinStack = exports.Stack = void 0;
class Stack {
    constructor(cmp, equals) {
        this.cmp = cmp;
        this.equals = equals;
        this.stk = [];
        this.monostk = [];
    }
    get best() {
        if (this.monostk.length == 0) {
            return null;
        }
        return this.monostk[this.monostk.length - 1];
    }
    push(x) {
        this.stk.push(x);
        if (this.best == null || this.cmp(x, this.best)) {
            this.monostk.push(x);
        }
    }
    pop() {
        if (this.best == null) {
            console.error('tried to pop from an empty Stack');
            return;
        }
        if (this.equals(this.stk[this.stk.length - 1], this.best)) {
            this.monostk.pop();
        }
        this.stk.pop();
    }
    top() {
        if (this.stk.length == 0) {
            console.error('tried to get element from an empty Stack');
            return null;
        }
        return this.stk[this.stk.length - 1];
    }
    size() {
        return this.stk.length;
    }
    empty() {
        return (this.stk.length == 0);
    }
    at(index) {
        if (index < 0 || index >= this.stk.length) {
            return null;
        }
        return this.stk[index];
    }
}
exports.Stack = Stack;
class MinStack extends Stack {
    constructor() {
        super((a, b) => (a <= b), (a, b) => (a == b));
    }
}
exports.MinStack = MinStack;
//# sourceMappingURL=stack.js.map