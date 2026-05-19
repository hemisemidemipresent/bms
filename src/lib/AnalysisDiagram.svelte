<script>
    import { onMount } from "svelte";
    import { ElementRect } from "runed";
    import MathExpr from "./MathExpr.svelte";
    import { l, sf } from "./BMSUtil.js";

    let { analyzedMatrix, standardizationSetting } = $props();

    const maxHeight = $derived.by(() => {
        let res = Math.max(...analyzedMatrix.colInfo.map((col) => col.height));
        return res;
    });

    // DOMRects to get the width
    let svgElement = $state();
    const svgRect = new ElementRect(() => svgElement);
    let bmsMatrixRows = $state([]); // collection of HTML elements
    const bmsMatrixRowRects = $derived.by(() => {
        analyzedMatrix; // update on matrix update cause bmsMatrixRows doesnt seem to trigger it idk
        standardizationSetting;
        return bmsMatrixRows.map((element) => new ElementRect(() => element));
    });

    function bottom(svg, rect, offsetX = 0) {
        return [(rect.x + rect.right) / 2 - svg.x + offsetX, rect.bottom - svg.y];
    }
    function right(svg, rect, offsetY = 0) {
        return [rect.right - svg.x, (rect.y + rect.bottom) / 2 - svg.y + offsetY];
    }
</script>

{#if analyzedMatrix}
    <div class="scrolling-wrapper">
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
                            <path d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`} class="zero-parent" fill="none" />
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
                        {#if analyzedMatrix.M[i][2] == 0 && !analyzedMatrix.upgraders[i]}
                            <!-- +1 case -->
                            <foreignObject {x} {y} width={rect.width} height={rect.height}>
                                <span
                                    class={`subscript-annotations ${!col.isOrdinalValueCounted ? "value-unused" : "subscript-color-none"}`}
                                    style:margin-right="auto">+1</span
                                >
                            </foreignObject>
                        {:else if analyzedMatrix.M[i][2] == 0}
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
                    {@const parent = analyzedMatrix.colInfo[col.zeroParentIndex]}
                    {@const isOrange = parent && !parent.isOrdinalValueCounted}
                    <span
                        style:grid-column-start={i + 1}
                        style:grid-row-start={(maxHeight - col.height) * 3 + 1}
                        class={`${col.upgraderType == "simple" || !col.isOrdinalValueCounted ? "value-unused" : ""} ${isOrange ? "orange" : ""}`}
                    >
                        {#if standardizationSetting == 0}
                            <MathExpr obj={col.ordinalValue} />
                        {:else if standardizationSetting == 1}
                            <MathExpr obj={sf(col.ordinalValue)} />
                        {:else if standardizationSetting == 2}
                            <MathExpr obj={sf(col.ordinalValue)} />
                        {/if}
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
                        class={`bg-${col.upgraderType}`}
                    >
                        {col.value}
                    </span>
                {/each}
            </div>
        </div>
    </div>
{/if}

<style>
    .scrolling-wrapper {
        max-width: 95vw;
        overflow-x: auto;
        display: inline-block;
        padding: 1em;
        margin: 0 0 1em 0;
    }
    .wrapper {
        position: relative;
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
        min-width: max-content;
    }

    span {
        display: inline;
    }

    .bg-simple {
        color: var(--yellow);
        background: var(--bg-yellow);
    }
    .bg-ancestor {
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
    svg > .zero-parent {
        stroke: white;
    }
    svg > .one-parent {
        stroke: var(--gray1);
    }
    .subscript {
        color: var(--gray2);
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
</style>
