/*
A segment tree class that supports queries for range minimum
and range maximum.

Not yet imported by any files.
*/

const INF = 1000000000;

class Node {
  public mn: number;
  public mx: number;

  constructor(v: number) {
    this.mn = v;
    this.mx = v;
  }

  /**
   * Applies an update to this Node.
   * @param v the value to assign to this Node
   */
  apply(v: number) {
    this.mn = Math.min(this.mn, v);
    this.mx = Math.max(this.mx, v);
  }
}

class _SegTree {
  public n: number;
  private tree: Node[];
  /**
   * The procedure governing the union of two nodes.
   * @param a the left child
   * @param b the right child
   * @returns the united Node for the two children
   */
  unite(a: Node, b: Node): Node {
    const res = new Node(a.mn);
    res.apply(a.mx);
    res.apply(b.mn);
    res.apply(b.mx);
    return res;
  }

  /**
   * Pulls data from the two children nodes.
   * @param x the index of the new Node
   * @param z the index of the right child
   */
  pull(x: number, z: number) {
    this.tree[x] = this.unite(this.tree[x + 1], this.tree[z]);
  }

  constructor(n: number) {
    this.n = n;
    this.tree = Array<Node>(2 * n - 1);
  }

  build(x: number, l: number, r: number, v: number[]) {
    if (l == r) {
      this.tree[x] = new Node(v[l]);
      return;
    }
    const y = (l + r) >> 1;
    const z = x + ((y - l + 1) << 1);
    this.build(x + 1, l, y, v);
    this.build(z, y + 1, r, v);
    this.pull(x, z);
  }

  get(x: number, l: number, r: number, ll: number, rr: number): Node {
    if (ll <= l && r <= rr) {
      return this.tree[x];
    }
    const y = (l + r) >> 1;
    const z = x + ((y - l + 1) << 1);
    if (rr <= y) {
      return this.get(x + 1, l, y, ll, rr);
    }
    if (ll > y) {
      return this.get(z, y + 1, r, ll, rr);
    }
    return this.unite(
      this.get(x + 1, l, y, ll, rr),
      this.get(z, y + 1, r, ll, rr)
    );
  }

  modify(x: number, l: number, r: number, p: number, v: number): void {
    if (l == r) {
      this.tree[x].apply(v);
      return;
    }
    const y = (l + r) >> 1;
    const z = x + ((y - l + 1) << 1);
    if (p <= y) {
      this.modify(x + 1, l, y, p, v);
    } else {
      this.modify(z, y + 1, r, p, v);
    }
    this.pull(x, z);
  }
}

export class SegTree extends _SegTree {
  constructor(n: number) {
    super(n);
  }

  get(ll: number, rr: number): Node {
    return super.get(0, 0, super.n - 1, ll, rr);
  }

  modify(p: number, v: number): void {
    super.modify(0, 0, super.n - 1, p, v);
  }
}
