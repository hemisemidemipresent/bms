<script>
    import "@fontsource-variable/jetbrains-mono/wght.css";
    import "./app.css";

    import { BMSMatrixAnalysis } from "./lib/BMSMatrixAnalysis.js";
    import AnalysisDiagram from "./lib/AnalysisDiagram.svelte";
    import MathExpr from "./lib/MathExpr.svelte";
    import Table from "./lib/Table.svelte";

    const EBO = [
        [0, 0, 0],
        [1, 1, 1],
        [2, 1, 1],
        [3, 1, 0],
        [2, 0, 0],
    ];

    // let bmstext = $state("(0)(1,1,1)(2,1,1)(3,1,0)");
    let bmstext = $state("(0)(1,1,1)(2,1)(2,1)(1,1,1)");
    // let bmstext = $state("(0)(1,1,1)(2,1,1)(3)(2,1,1)");
    // let bmstext = $state(
    //     "(0,0,0)(1,1,1)(2,1,1)(3,1,0)(1,1,1)(2,1,1)(3,1,0)(1,1,0)(2,2,1)(3,2,1)(4,2,0)(2,2,1)(3,2,1)(4,2,0)",
    // );
    // let bmstext = $state(
    //     "(0,0,0)(1,1,1)(2,1,1)(3,1,0)(1,1,1)(2,1,1)(3,1,0)(1,1,0)(2,2,1)(3,2,1)(4,2,0)(2,2,1)(3,2,1)(4,2,0)(2,2,0)(3,3,1)(4,3,1)(5,3,0)(3,3,1)(4,3,1)(5,3,0)(3,3,0)(4,4,1)(5,4,1)(6,4,0)(4,4,1)(5,4,1)(6,3,0)(5,4,0)(6,5,1)(7,5,1)(8,5,0)(6,5,0)(7,6,1)(8,6,1)(9,6,0)(7,6,0)(8,7,1)(9,7,1)(10,6,0)(9,7,0)(10,8,0)",
    // );

    let cachedmatrix = "";

    let matrix = $derived.by(() => {
        if (bmstext == "") return [];
        if (bmstext.includes("(") && bmstext.includes(")")) {
            let cleanedText = bmstext
                .replaceAll(/\s+/g, "")
                .replaceAll(")(", "],[")
                .replaceAll("(", "[")
                .replaceAll(")", "]");

            try {
                let output = JSON.parse(`[${cleanedText}]`);

                // pad with 0s
                let result = output.map((col) => {
                    if (col.length < 3) {
                        col = col.concat(new Array(3 - col.length).fill(0));

                        return col;
                    } else {
                        return col;
                    }
                });

                function compareNestedArrays(a, b) {
                    // Compare two arrays of numbers lexicographically
                    function compareArray(x, y) {
                        const len = Math.min(x.length, y.length);

                        for (let i = 0; i < len; i++) {
                            if (x[i] < y[i]) return -1;
                            if (x[i] > y[i]) return 1;
                        }

                        // Shorter array comes first if prefixes are equal
                        if (x.length < y.length) return -1;

                        if (x.length > y.length) return 1;

                        return 0;
                    }

                    const len = Math.min(a.length, b.length);

                    for (let i = 0; i < len; i++) {
                        const cmp = compareArray(a[i], b[i]);

                        if (cmp !== 0) return cmp;
                    }

                    // Shorter outer array comes first if prefixes are equal
                    if (a.length < b.length) return -1;

                    if (a.length > b.length) return 1;

                    return 0;
                }

                if (compareNestedArrays(result, EBO) != -1) {
                    alert("Input matrix too powerful!");
                    return cachedmatrix;
                }
                // update cache
                cachedmatrix = result;
                return result;
            } catch (error) {
                return cachedmatrix;
            }
        } else if (!bmstext.includes("(") && !bmstext.includes(")") && !bmstext.includes(",")) {
            let cleanedText = bmstext.trim();
            let matrix = cleanedText.split(/\s+/).map((colString) => {
                let column = [];
                for (let i = 0; i < 3; i++) {
                    column.push(parseInt(colString[i]) || 0);
                }
                return column;
            });
            cachedmatrix = matrix;
            return matrix;
        }
        return cachedmatrix;
    });

    let analyzedMatrix = $derived.by(() => {
        standardizationSetting; //test
        return new BMSMatrixAnalysis(matrix);
    });

    let standardizationSetting = $state(1);
</script>

<main>
    <div class="flex-vertical">
        <h1>BMS analyzer</h1>
        <p>For TSS below (0)(1,1,1)(2,1,1)(3,1,0)(2,0,0) = EBO</p>
        <input type="text" bind:value={bmstext} />
        <div class="flex-row">
            <button onclick={() => (bmstext = "0 111 210 320")}>ψ<sub>0</sub>(Ω<sub>ω+1)</sub></button>
            <button onclick={() => (bmstext = "0 111 211")}>ψ<sub>0</sub>(Ω<sub>ω<sup>2</sup></sub>)</button>
            <button onclick={() => (bmstext = "0 111 211 3 211")}>ψ<sub>0</sub>(Ω<sub>ω<sup>ω+1</sup></sub>)</button>
            <button onclick={() => (bmstext = "0 111 211 310")}>ψ<sub>0</sub>(Ω<sub>Ω</sub>)</button>
            <button onclick={() => (bmstext = "0 111 211 310 111 211 310")}
                >ψ<sub>0</sub>(Ω<sub>Ω<sub>Ω</sub></sub>)</button
            >
            <button
                onclick={() =>
                    (bmstext =
                        "(0,0,0)(1,1,1)(2,1,1)(3,1,0)(1,1,1)(2,1,1)(3,1,0)(1,1,0)(2,2,1)(3,2,1)(4,2,0)(2,2,1)(3,2,1)(4,2,0)(2,2,0)(3,3,1)(4,3,1)(5,3,0)(3,3,1)(4,3,1)(5,3,0)(3,3,0)(4,4,1)(5,4,1)(6,4,0)(4,4,1)(5,4,1)(6,3,0)(5,4,0)(6,5,1)(7,5,1)(8,5,0)(6,5,0)(7,6,1)(8,6,1)(9,6,0)(7,6,0)(8,7,1)(9,7,1)(10,6,0)(9,7,0)(10,8,0)")}
                >ψ<sub>0</sub>(Ω<sub>Ω<sub>Ω<sub>3</sub>+2</sub>+1</sub>)</button
            >
        </div>

        <h1><MathExpr obj={analyzedMatrix.finalOrdinal(true)} /></h1>

        <span style="font-size: 0.9em;">
            raw, unstandardized expression:
            <MathExpr obj={analyzedMatrix.finalOrdinal()} />
        </span>
        <div></div>

        <div class="margin-1">
            <h2>Settings</h2>
            <p>NOTE: may break</p>
            <div style="text-align: left;">
                <label>
                    <input type="radio" value={0} bind:group={standardizationSetting} />
                    Keep non-standard ordinals
                </label>
                <br />
                <label>
                    <input type="radio" value={1} bind:group={standardizationSetting} />
                    Only show standardized ordinals
                </label>
                <!-- <br /> -->
                <!-- <label>
                    <input type="radio" value={2} bind:group={standardizationSetting} />

                    Show standardization calculations
                </label> -->
            </div>
        </div>
        <div class="margin-1">
            <h2>Legend</h2>

            <div style="display: grid; grid-template-columns: 5em 1fr; gap: 0 1em">
                <p>Ω<sub>ω</sub></p>
                <p style="justify-self: start; font-size: 0.75em;">
                    ordinal notation associated with the current column
                </p>
                <p style="color: var(--gray2);">ω</p>
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
                    <span style="color: var(--gray2);">—</span>
                    <span style="font-size: 0.9em;">1-parent</span>
                </p>

                <p>
                    <span style="color: var(--yellow);">—</span>
                    <span style="font-size: 0.9em;">Simple Upgrader</span>
                </p>

                <p>
                    <span style="color: var(--green);">—</span>
                    <span style="font-size: 0.9em;">Ancestor Upgrader</span>
                </p>

                <p>
                    <span style="color: var(--orange);">—</span>
                    <span style="font-size: 0.9em;">idk what this is called</span>
                </p>
            </div>
        </div>

        <AnalysisDiagram {analyzedMatrix} {standardizationSetting} />

        <details>
            <summary>Table</summary>
            <Table {analyzedMatrix} />
        </details>

        <div class="margin-1">
            <h2>Notes</h2>

            <ul style="text-align: left;">
                <li>
                    Code can be found on my
                    <a href="https://github.com/hemisemidemipresent/bms">Github</a>
                    , this site was made with svelte + vite
                </li>

                <li>
                    Much of the actual analysis code was ripped off from

                    <a href="https://solarzone1010.github.io/bms-analyzer.html">Solarzone's &lt;EBO BMS analyzer</a>
                </li>
            </ul>
        </div>
    </div>
</main>

<style>
    main {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .flex-vertical {
        display: flex;
        flex: flexbox;
        flex-direction: column;
        align-items: center;
    }

    input[type="text"] {
        width: 75vw;
        background: var(--bg0);
        color: white;
        font-family: jetbrains, monospace;
        padding: 0.5em;
        margin: 0.5em;
        font-size: 16px;
        border: 2px solid var(--bg1);
        border-radius: 0.5em;
        @media (max-width: 1024px) {
            width: 90vw;
        }
    }

    input[type="radio"] {
        accent-color: var(--green);
    }
</style>
