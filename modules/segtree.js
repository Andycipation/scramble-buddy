/*
A segment tree class that supports queries for range minimum
and range maximum.

Not yet imported by any files.
*/


const INF = 1000000000;

class Node {
  constructor(v) {
    this.mn = v;
    this.mx = v;
  }

  /**
   * Applies an update to this Node.
   * @param {Number} v the value to assign to this Node
   */
  apply(v) {
    this.mn = Math.min(this.mn, v);
    this.mx = Math.max(this.mx, v);
  }
}


class _SegTree {
  /**
   * The procedure governing the union of two nodes.
   * @param {Node} a the left child
   * @param {Node} b the right child
   * @returns {Node} the united Node for the two children
   */
  unite(a, b) {
    res = new Node(a.mn);
    res.apply(a.mx);
    res.apply(b.mn);
    res.apply(b.mx);
    return res;
  }

  /**
   * Pulls data from the two children nodes.
   * @param {Number} x the index of the new Node
   * @param {Number} z the index of the right child
   */
  pull(x, z) {
    this.tree[x] = this.unite(this.tree[x + 1], this.tree[z]);
  }

  constructor(n) {
    this.n = n;
    this.tree = Array(2 * n - 1);
  }

  build(x, l, r, v) {
    if (l == r) {
      this.tree[x] = new Node(v[l]);
      return;
    }
    y = (l + r) >> 1;
    z = x + ((y - l + 1) << 1);
    this.build(x + 1, l, y, v);
    this.build(z, y + 1, r, v);
    this.pull(x, z);
  }

  get(x, l, r, ll, rr) {
    if (ll <= l && r <= rr) {
      return this.tree[x];
    }
    y = (l + r) >> 1;
    z = x + ((y - l + 1) << 1);
    if (rr <= y) {
      return this.get(x + 1, l, y, ll, rr);
    }
    if (ll > y) {
      return this.get(z, y + 1, r, ll, rr);
    }
    return this.unite(this.get(x + 1, l, y, ll, rr), this.get(z, y + 1, r, ll, rr));
  }

  modify(x, l, r, p, v) {
    if (l == r) {
      this.tree[x].apply(v);
      return;
    }
    y = (l + r) >> 1;
    z = x + ((y - l + 1) << 1);
    if (p <= y) {
      this.modify(x + 1, l, y, p, v);
    } else {
      this.modify(z, y + 1, r, p, v);
    }
    this.pull(x, z);
  }
}


class SegTree extends _SegTree {
  constructor(n) {
    super(n);
  }

  get(ll, rr) {
    super.get(0, 0, super.n - 1, ll, rr);
  }

  modify(p, v) {
    super.modify(0, 0, super.n - 1, p, v);
  }
}


exports.SegTree = SegTree;