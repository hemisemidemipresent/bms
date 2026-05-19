import { add, exp, eq, l, sf, ZERO, ONE } from "./BMSUtil.js";
export class BMSMatrixAnalysis {
    M = [];
    // todo: cache all the functions
    // u done
    upgraders = [];
    // v done
    subscriptCache = [];
    // cache of the intermediate calculation values for display purposes
    subscriptIntermediateValues = [];
    // o
    ordinalCache = [];

    constructor(matrix) {
        if (!matrix) this.M = [];
        else this.M = matrix;
        // cache of the function below
        this.upgraders = this.M.map((col, i) => this.U(i));

        // main meat of calculations
        let columns = [];

        this.M.forEach((col, i) => {
            const zeroParentIndex = this.P(0, i);
            let height = zeroParentIndex != -1 ? columns[zeroParentIndex].height + 1 : 0;
            const oneParentIndex = this.P(1, i);
            let oneHeight = oneParentIndex != -1 ? columns[oneParentIndex].oneHeight + 1 : 0;

            // test type of upgrader:
            const children = this.C(i);
            let upgraderType;
            if (this.upgraders.includes(i)) {
                if (children.length > 0) {
                    if (eq(matrix[children.at(-1)], [this.M[i][0] + 1, this.M[i][1], 1])) upgraderType = "simple";
                    else upgraderType = "ancestor";
                } else upgraderType = "simple";
            }

            // this is when for example in (0)(1,1,1)(2,1,1)(3,1,0), the (2,1,1) column is not "counted" per-se,
            // but instead co-opted into the subscript of (1,1,1)
            // there might be more cases idk
            const parent = this.M[zeroParentIndex];
            let isCounted = true;
            if (parent) {
                isCounted = !eq([parent[0] + 1, parent[1], 1], col);
            }

            columns.push({
                value: `(${col})`,
                index: i,
                oneParentIndex: oneParentIndex,
                oneHeight: oneHeight,
                zeroParentIndex: zeroParentIndex,
                height: height,
                children: children,
                upgraderType,
                isOrdinalValueCounted: isCounted,
                subscript: this.v(i),
                ordinalValue: this.o(i),
                subscriptIntermediateValues: this.subscriptIntermediateValues[i],
            });
        });
        this.colInfo = columns;
    }

    // returns the r-Parent of column n. -1 if no parent found
    P(r, n) {
        if (r == -1) {
            return n - 1;
        }
        let q = this.P(r - 1, n);
        while (q > -1 && this.M[q][r] >= this.M[n][r]) {
            q = this.P(r - 1, q);
        }
        return q;
    }

    // returns the index of column that upgrades specified column
    U(n) {
        if (this.M[n][1] == 0 || this.M[n][2] == 1 || n + 1 == this.M.length) {
            return;
        }
        let m = this.P(1, n);
        let L = [this.M[m][0] + 1, this.M[n][1], this.M[m][2] + 1];
        if (this.P(1, n) == this.P(1, n + 1) && eq(this.M[n + 1], L)) {
            return n + 1;
        }
        let q = n;
        while (q != -1) {
            q = this.P(0, q);
            if (this.P(1, n) == this.P(1, q) && eq(this.M[q], L) && this.M[n + 1][0] > this.M[q][0]) {
                return q;
            }
        }
        return;
    }
    // children (specifically 0-children)
    C(n) {
        let X = [];
        for (let i = 0; i < this.M.length; i++) {
            if (this.P(0, i) == n) {
                X.push(i);
            }
        }
        return X;
    }

    v(n) {
        if (this.subscriptCache[n]) return this.subscriptCache[n];

        if (this.M[n][1] == 0) {
            this.subscriptCache[n] = [];
            return [];
        }
        if (this.M[n][2] == 0) {
            let u = this.U(n) ? l(this.v(this.U(n))) : ONE;
            this.subscriptIntermediateValues[n] = u;
            let subscript = add(this.v(this.P(1, n)), u);
            this.subscriptCache[n] = subscript;
            return subscript;
        }
        let p = ONE;
        let children = this.C(n);
        let intermediates = [];
        for (let j = 0; j < children.length; j++) {
            let i = children[j];
            if (!eq(this.M[i], [this.M[n][0] + 1, this.M[n][1], 1])) {
                continue;
            }
            let q = [];
            for (j of this.C(i)) {
                q = add(q, this.o(j));
            }
            p = add(p, exp(q));
            intermediates.push(q);
        }
        this.subscriptIntermediateValues[n] = intermediates;
        let subscript = add(this.v(this.P(1, n)), exp(p));
        this.subscriptCache[n] = subscript;
        return subscript;
    }
    o(n) {
        if (this.ordinalCache[n]) return this.ordinalCache[n];

        let S = [];
        let children = this.C(n);

        for (let j = 0; j < children.length; j++) {
            let i = children[j];
            if (eq(this.M[i], [this.M[n][0] + 1, this.M[n][1], 1])) {
                continue;
            }
            if (this.upgraders.includes(i)) {
                let c = this.C(i);
                if (c.length) {
                    if (eq(this.M[c.at(-1)], [this.M[i][0] + 1, this.M[i][1], 1])) {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            S = add(S, this.o(i));
        }
        let ordinal = [this.v(n), S, []];
        this.ordinalCache[n] = ordinal;
        return ordinal;
    }
    finalOrdinal(standard=false) {
        let sum = [];
        for (let i = 0; i < this.M.length; i++) {
            if (eq(this.M[i], [0, 0, 0])) {
                sum = add(sum, this.o(i));
            }
        }
        if (standard) return sf(sum)
        return sum;
    }
}