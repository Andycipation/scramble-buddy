"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegTree = void 0;
const INF = 1000000000;
class Node {
    constructor(v) {
        this.mn = v;
        this.mx = v;
    }
    apply(v) {
        this.mn = Math.min(this.mn, v);
        this.mx = Math.max(this.mx, v);
    }
}
class _SegTree {
    constructor(n) {
        this.n = n;
        this.tree = Array(2 * n - 1);
    }
    unite(a, b) {
        let res = new Node(a.mn);
        res.apply(a.mx);
        res.apply(b.mn);
        res.apply(b.mx);
        return res;
    }
    pull(x, z) {
        this.tree[x] = this.unite(this.tree[x + 1], this.tree[z]);
    }
    build(x, l, r, v) {
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
    get(x, l, r, ll, rr) {
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
        return this.unite(this.get(x + 1, l, y, ll, rr), this.get(z, y + 1, r, ll, rr));
    }
    modify(x, l, r, p, v) {
        if (l == r) {
            this.tree[x].apply(v);
            return;
        }
        const y = (l + r) >> 1;
        const z = x + ((y - l + 1) << 1);
        if (p <= y) {
            this.modify(x + 1, l, y, p, v);
        }
        else {
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
        return super.get(0, 0, super.n - 1, ll, rr);
    }
    modify(p, v) {
        super.modify(0, 0, super.n - 1, p, v);
    }
}
exports.SegTree = SegTree;
//# sourceMappingURL=segtree.js.map