/*
Data structure for querying minimums in stack. Using the C++ stack as a
template.

Link: http://www.cplusplus.com/reference/stack/stack/
*/


class Stack {
  constructor(cmp, equals) {
    this.cmp = cmp;  // cmp(a, b) is true if a is better than b
    // cmp should be transitive, i.e. cmp(a, b) && cmp(b, c) implies cmp(a, c).
    this.equals = equals;  // equals(a, b) returns if a and b are equal
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
}


/*
This is just a specialization of the above class, with
this.cmp = (a, b) => (a <= b);
this.equals = (a, b) => (a == b);
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
