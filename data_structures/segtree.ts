/*
A segment tree class that supports queries for range minimum
and range maximum.

Not yet imported by any files.
*/

class TreeNode {
  public mn = 0;
  public mx = 0;

  constructor(v: number) {
    this.mn = v;
    this.mx = v;
  }

  /**
   * Applies an update to this TreeNode.
   * @param v the value to assign to this TreeNode
   */
  public apply(v: number) {
    this.mn = v;
    this.mx = v;
  }
}

class SegTree {
  public n: number;
  private tree: TreeNode[];
  /**
   * The procedure governing the union of two nodes.
   * @param a the left child
   * @param b the right child
   * @returns the united TreeNode for the two children
   */
  private unite(a: TreeNode, b: TreeNode): TreeNode {
    const res = new TreeNode(0);
    res.mn = Math.min(a.mn, b.mn);
    res.mx = Math.max(a.mx, b.mx);
    return res;
  }

  /**
   * Pulls data from the two children nodes.
   * @param x the index of the new TreeNode
   * @param z the index of the right child
   */
  private pull(x: number, z: number) {
    this.tree[x] = this.unite(this.tree[x + 1], this.tree[z]);
  }

  public constructor(n: number) {
    this.n = n;
    this.tree = Array<TreeNode>(2 * n - 1);
    this.build(0, 0, n - 1, Array<number>(n));
  }

  private build(x: number, l: number, r: number, v: number[]) {
    if (l == r) {
      this.tree[x] = new TreeNode(v[l]);
      return;
    }
    const y = (l + r) >> 1;
    const z = x + ((y - l + 1) << 1);
    this.build(x + 1, l, y, v);
    this.build(z, y + 1, r, v);
    this.pull(x, z);
  }

  private _get(
    x: number,
    l: number,
    r: number,
    ll: number,
    rr: number
  ): TreeNode {
    if (ll <= l && r <= rr) {
      return this.tree[x];
    }
    const y = (l + r) >> 1;
    const z = x + ((y - l + 1) << 1);
    if (rr <= y) {
      return this._get(x + 1, l, y, ll, rr);
    }
    if (ll > y) {
      return this._get(z, y + 1, r, ll, rr);
    }
    return this.unite(
      this._get(x + 1, l, y, ll, rr),
      this._get(z, y + 1, r, ll, rr)
    );
  }

  private _modify(x: number, l: number, r: number, p: number, v: number): void {
    if (l == r) {
      this.tree[x].apply(v);
      return;
    }
    const y = (l + r) >> 1;
    const z = x + ((y - l + 1) << 1);
    if (p <= y) {
      this._modify(x + 1, l, y, p, v);
    } else {
      this._modify(z, y + 1, r, p, v);
    }
    this.pull(x, z);
  }

  public get(ll: number, rr: number): TreeNode {
    return this._get(0, 0, this.n - 1, ll, rr);
  }

  public modify(p: number, v: number): void {
    this._modify(0, 0, this.n - 1, p, v);
  }
}

export default SegTree;
