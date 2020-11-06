/*
Data structure for querying minimums in stack. Using the C++ stack as a
template.

Link: http://www.cplusplus.com/reference/stack/stack/
*/


/**
 * A Stack that maintains the best value it contains.
 */
class Stack {
  /**
   * The constructor for a Stack.
   * @param {Function} cmp the comparison to use; cmp(a, b) is true if a is
   * considered to be better than b; cmp should be transitive,
   * i.e. cmp(a, b) && cmp(b, c) implies cmp(a, c)
   * @param {Function} equals the equality operator to use
   */
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

  /**
   * Adds an element to the top of this Stack.
   * @param {any} x the element to push to the Stack
   */
  push(x) {
    this.stk.push(x);
    if (this.best == null || this.cmp(x, this.best)) {
      this.monostk.push(x);
    }
  }

  /**
   * Removes the element at the top of this stack.
   */
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

  /**
   * Returns the element at the top of this Stack.
   * @returns {any} the element at the top of this Stack
   */
  top() {
    if (this.stk.length == 0) {
      console.error('tried to get element from an empty Stack');
      return null;
    }
    return this.stk[this.stk.length - 1];
  }

  /**
   * Returns the size of this Stack.
   * @returns {number} the size of this Stack
   */
  size() {
    return this.stk.length;
  }

  /**
   * Returns whether or not this Stack is empty.
   * @returns {boolean} whether or not this Stack is empty
   */
  empty() {
    return (this.stk.length == 0);
  }
}


/**
 * A specialization of the above class, with comparison <= and
 * equality operator ==.
 */
class MinStack extends Stack {
  constructor() {
    super(
      (a, b) => (a <= b),  // comparison
      (a, b) => (a == b)   // equality
    );
  }
}


exports.Stack = Stack;
exports.MinStack = MinStack;
