/*
Data structure for querying minimums in stack. Using the C++ stack as a
template.

Link: http://www.cplusplus.com/reference/stack/stack/
*/


/**
 * A Stack that maintains the best value it contains.
 */
export class Stack<T> {
  public cmp: (a: T, b: T) => boolean;
  public equals: (a: T, b: T) => boolean;
  public stk: T[];
  public monostk: T[];

  /**
   * The constructor for a Stack.
   * @param cmp the comparison to use; cmp(a, b) is true if a is
   * considered to be better than b; cmp should be transitive,
   * i.e. cmp(a, b) && cmp(b, c) implies cmp(a, c)
   * @param equals the equality operator to use
   */
  constructor(cmp: (a: T, b: T) => boolean, equals: (a: T, b: T) => boolean) {
    this.cmp = cmp;
    this.equals = equals;
    this.stk = [];
    this.monostk = [];
  }

  get best(): T | never {
    if (this.monostk.length == 0) {
      throw 'tried to get best on an empty Stack';
    }
    return this.monostk[this.monostk.length - 1];
  }

  /**
   * Adds an element to the top of this Stack.
   * @param x the element to push to the Stack
   */
  push(x: T): void {
    this.stk.push(x);
    if (this.monostk.length == 0 || this.cmp(x, this.best)) {
      this.monostk.push(x);
    }
  }

  /**
   * Removes the element at the top of this stack.
   */
  pop(): void {
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
   * @returns the element at the top of this Stack
   */
  top(): T | never {
    if (this.stk.length == 0) {
      throw 'tried to get top element from an empty Stack';
    }
    return this.stk[this.stk.length - 1];
  }

  /**
   * Returns the size of this Stack.
   * @returns the size of this Stack
   */
  size(): number {
    return this.stk.length;
  }

  /**
   * Returns whether or not this Stack is empty.
   * @returns whether or not this Stack is empty
   */
  empty(): boolean {
    return (this.stk.length == 0);
  }

  at(index: number): T | never {
    if (index < 0 || index >= this.stk.length) {
      throw 'tried to access an out-of-range index of a Stack';
    }
    return this.stk[index];
  }
}


/**
 * A specialization of the above class, with comparison <= and
 * equality operator ==.
 */
export class MinStack<T> extends Stack<T> {
  constructor() {
    super(
      (a, b) => (a <= b),  // comparison
      (a, b) => (a == b)   // equality
    );
  }
}
