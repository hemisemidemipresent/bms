<script>
    import { onMount } from "svelte";
    let { matrix } = $props();
    import MathExpr from "./MathExpr.svelte";
    import { ElementRect } from "runed";
    import { add, exp, eq, l, s, ZERO, ONE } from "./BMSUtil.js";
    class BMSMatrixAnalysis {
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
            console.log(intermediates);
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
    }

    const analyzedMatrix = $derived.by(() => {
        return new BMSMatrixAnalysis(matrix);
    });
    const colInfo = $derived(analyzedMatrix.colInfo);

    const maxHeight = $derived.by(() => {
        let res = Math.max(...analyzedMatrix.colInfo.map((col) => col.height));
        return res;
    });

    // DOMRects to get the width
    let svgElement = $state();
    const svgRect = new ElementRect(() => svgElement);
    let bmsMatrixRows = $state([]); // collection of HTML elements
    const bmsMatrixRowRects = $derived.by(() => {
        matrix; // update on matrix update cause bmsMatrixRows doesnt seem to trigger it idk
        return bmsMatrixRows.map((element) => new ElementRect(() => element));
    });

    function bottom(svg, rect, offsetX = 0) {
        return [(rect.x + rect.right) / 2 - svg.x + offsetX, rect.bottom - svg.y];
    }
    function right(svg, rect, offsetY = 0) {
        return [rect.right - svg.x, (rect.y + rect.bottom) / 2 - svg.y + offsetY];
    }
</script>

<table>
    <thead>
        <tr>
            <th>i</th>
            <th>M[i]</th>
            <th>o(M,i)</th>
            <th>v(M,i)</th>
            <th>U(M,i)</th>
            <th>Children</th>
        </tr>
    </thead>
    <tbody>
        {#each analyzedMatrix.colInfo as col, i}
            <tr class={col.upgraderType == "simple" ? "simple" : col.upgraderType == "ancestor" ? "ancestor" : ""}>
                <td>{i}</td>
                <td>{col.value}</td>
                <td><MathExpr obj={col.ordinalValue} /></td>
                <td><MathExpr obj={col.subscript} /></td>
                <td>{analyzedMatrix.upgraders[i]}</td>
                <td>{col.children.join(",")}</td>
            </tr>
        {/each}
    </tbody>
</table>

<div class="margin-1">
    <h2>Legend</h2>

    <div style="display:grid; grid-template-columns: 5em 1fr; gap: 0 1em">
        <p>Ω<sub>ω</sub></p>
        <p style="justify-self:start; font-size: 0.75em;">ordinal notation associated with the current column</p>
        <p class="subscript-color-none">ω</p>
        <p style="justify-self:start; font-size: 0.75em;">ψ-subscript associated with the current column</p>
        <p>(2,1,0)</p>
        <p style="justify-self:start; font-size: 0.75em;">value of current column</p>
    </div>

    <div class="margin-05">
        <p>
            <span>—</span>
            <span style="font-size: 0.9em;">0-parent</span>
        </p>
        <p>
            <span class="one-parent">—</span>
            <span style="font-size: 0.9em;">1-parent</span>
        </p>

        <p>
            <span class="subscript-color-simple">—</span>
            <span style="font-size: 0.9em;">Simple Upgrader</span>
        </p>
        <p>
            <span class="subscript-color-ancestor">—</span>
            <span style="font-size: 0.9em;">Ancestor Upgrader</span>
        </p>
        <p>
            <span class="orange">—</span>
            <span style="font-size: 0.9em;">idk what this is called</span>
        </p>
    </div>
</div>

{#if matrix}
    <div class="wrapper">
        <svg id="connections" bind:this={svgElement}>
            <!-- 0-parent and 1-parent relationships -->
            {#each bmsMatrixRowRects as rect, i}
                {@const col = analyzedMatrix.colInfo[i]}
                {#if col && col.zeroParentIndex >= 0}
                    {@const parentRect = bmsMatrixRowRects[col.zeroParentIndex]}
                    {@const [x1, y1] = right(svgRect, parentRect, -2.5)}
                    {@const [x2, y2] = bottom(svgRect, rect, -2.5)}
                    <!-- isOrdinalValueCounted -->
                    {#if !analyzedMatrix.colInfo[i].isOrdinalValueCounted}
                        <path
                            d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2 + 6}`}
                            class="stroke-orange"
                            stroke-width="2px"
                            stroke-dasharray="4 2"
                            fill="none"
                        />
                        <path d={`M ${x2} ${y2} L ${x2 + 3} ${y2 + 6} L ${x2 - 3} ${y2 + 6}`} class="fill-orange" />
                    {:else if !analyzedMatrix.colInfo[col.zeroParentIndex].isOrdinalValueCounted}
                        <path
                            d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`}
                            class="stroke-orange"
                            stroke-width="2px"
                            fill="none"
                        />
                    {:else}
                        <path d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`} stroke="white" fill="none" />
                    {/if}
                {/if}

                {#if col && col.oneParentIndex >= 0}
                    {@const parentRect = bmsMatrixRowRects[col.oneParentIndex]}
                    {@const [x1, y1] = right(svgRect, parentRect, 2.5)}
                    {@const [x2, y2] = bottom(svgRect, rect, 2.5)}
                    <path d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`} class="one-parent" fill="none" />
                {/if}
            {/each}
            <!-- additional annotations -->
            {#each bmsMatrixRowRects as rect, i}
                <!-- upgrading relationships -->
                {#if analyzedMatrix.upgraders[i]}
                    {@const rect = bmsMatrixRowRects[i]}
                    {@const parentIndex = analyzedMatrix.colInfo[i].oneParentIndex}
                    {@const parentRect = bmsMatrixRowRects[parentIndex]}
                    {@const upgraderIndex = analyzedMatrix.upgraders[i]}
                    {@const upgraderRect = bmsMatrixRowRects[upgraderIndex]}
                    {#if rect && upgraderRect}
                        {@const [parentX, parentY] = right(svgRect, parentRect, 2.5)}
                        {@const [upgraderX, upgraderY] = bottom(svgRect, upgraderRect, 2.5)}
                        {@const [rectX, rectY] = bottom(svgRect, rect, 2.5)}
                        <path
                            d={`M ${upgraderX} ${upgraderY} L ${upgraderX} ${parentY} L ${rectX} ${parentY} L ${rectX} ${rectY}`}
                            class={analyzedMatrix.colInfo[upgraderIndex].upgraderType}
                            fill="none"
                        />
                    {/if}
                {/if}
                <!-- subscript calculations -->
                {@const col = analyzedMatrix.colInfo[i]}

                {#if col && col.oneParentIndex >= 0}
                    {@const parentRect = bmsMatrixRowRects[col.oneParentIndex]}
                    {@const [x1, y1] = right(svgRect, parentRect, 2.5)}
                    {@const [x2, y2] = bottom(svgRect, rect, 2.5)}
                    {@const x = x2 + 5}
                    {@const y = (y1 + y2) / 2 - 10}
                    {#if matrix[i][2] == 0 && !analyzedMatrix.upgraders[i]}
                        <!-- +1 case -->
                        <foreignObject {x} {y} width={rect.width} height={rect.height}>
                            <span
                                class={`subscript-annotations ${!col.isOrdinalValueCounted ? "value-unused" : "subscript-color-none"}`}
                                style:margin-right="auto">+1</span
                            >
                        </foreignObject>
                    {:else if matrix[i][2] == 0}
                        <!-- upgrader case -->
                        <foreignObject {x} {y} width={rect.width} height={rect.height}>
                            <span
                                class={`subscript-annotations subscript-color-${analyzedMatrix.colInfo[analyzedMatrix.upgraders[i]]?.upgraderType || "none"}`}
                                style:margin-right="auto"
                            >
                                +<MathExpr obj={l(analyzedMatrix.colInfo[analyzedMatrix.upgraders[i]].subscript)} />
                            </span>
                        </foreignObject>
                    {:else}
                        <foreignObject {x} {y} width={rect.width} height={rect.height}>
                            <span
                                class={`subscript-annotations ${!col.isOrdinalValueCounted ? "value-unused" : "subscript-color-none"}`}
                                style:margin-right="auto"
                            >
                                +ω<sup>
                                    {#each col.subscriptIntermediateValues as intermediate}
                                        ω<sup class="orange"><MathExpr obj={intermediate} /></sup>
                                    {/each}
                                </sup>
                            </span>
                        </foreignObject>
                    {/if}
                {/if}
            {/each}
        </svg>
        <div class="grid" style:grid-template-columns={`repeat(${analyzedMatrix.M.length}, 1fr)`}>
            {#each analyzedMatrix.colInfo as col, i}
                <span
                    style:grid-column-start={i + 1}
                    style:grid-row-start={(maxHeight - col.height) * 3 + 1}
                    class={col.upgraderType == "simple" || !col.isOrdinalValueCounted ? "value-unused" : ""}
                >
                    <MathExpr obj={col.ordinalValue} />
                </span>
                <span
                    style:grid-column-start={i + 1}
                    style:grid-row-start={(maxHeight - col.height) * 3 + 2}
                    class={`subscript-color-${analyzedMatrix.colInfo[i]?.upgraderType || "none"} ${!col.isOrdinalValueCounted ? "value-unused" : ""}`}
                >
                    <!-- class={`subscript-color-${analyzedMatrix.colInfo[analyzedMatrix.upgraders[i]]?.upgraderType || "none"}`} -->
                    <MathExpr obj={col.subscript} />
                </span>
                <span
                    style:grid-column-start={i + 1}
                    style:grid-row-start={(maxHeight - col.height) * 3 + 3}
                    bind:this={bmsMatrixRows[i]}
                    class={"bg-" + col.upgraderType}
                >
                    {col.value}
                </span>
            {/each}
        </div>
        <!-- <p>{bmsMatrixRowRects.map((rect) => `[${Math.floor(rect.x)}, ${Math.floor(rect.y)}]`)}</p> -->
        <!-- <p>{bmsMatrixRowRects?.length}</p> -->
        <!-- <p>{JSON.stringify(analyzedMatrix.colInfo, null, 4)}</p> -->
    </div>
{/if}

<style>
    tbody > .simple {
        color: var(--yellow);
        background: var(--bg-yellow);
    }
    tbody > .ancestor {
        color: var(--green);
        background: var(--bg-green);
    }

    .wrapper {
        position: relative;
        width: minmax(min-content, 100vw);
        overflow: auto;
    }
    #connections {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
    }
    .grid {
        display: grid;
        justify-items: center;
        align-items: center;
    }

    span {
        display: inline;
    }

    .bg-simple {
        /*background: rgba(255, 255, 0, 0.5);*/
        color: var(--yellow);
        background: var(--bg-yellow);
    }
    .bg-ancestor {
        /*background: rgba(0, 255, 0, 0.5);*/
        color: var(--green);
        background: var(--bg-green);
    }

    .subscript-color-simple {
        color: var(--yellow);
    }
    .subscript-color-ancestor {
        color: var(--green);
    }
    .subscript-color-none {
        color: var(--gray2);
    }

    .value-unused {
        color: var(--bg5);
    }

    svg > .simple {
        stroke: var(--yellow);
        stroke-width: 2px;
    }
    svg > .ancestor {
        stroke: var(--green);
        stroke-width: 2px;
    }

    .subscript {
        color: #ccc;
    }

    .subscript-annotations {
        font-size: 0.75em;
    }
    foreignObject {
        text-align: left;
    }
    .stroke-orange {
        stroke: var(--orange);
    }
    .fill-orange {
        fill: var(--orange);
    }
    .orange {
        color: var(--orange);
    }
    .one-parent {
        stroke: var(--gray1);
        color: var(--gray1);
    }
</style>
