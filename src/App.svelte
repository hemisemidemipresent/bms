<script>
    import { onMount } from "svelte";
    import Table from "./lib/Table.svelte";
    import AnalysisCanvas from "./lib/AnalysisCanvas.svelte";

    // let bmstext = $state("(0)(1,1,1)(2,1,1)(3,1,0)");
    let bmstext = $state("(0)(1,1,1)(2,1)(2,1)(1,1,1)");
    // let bmstext = $state("(0)(1,1,1)(2,1)(2,1)(0)");
    let cachedmatrix = "";
    let matrix = $derived.by(() => {
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
            if (
                compareNestedArrays(result, [
                    [0, 0, 0],
                    [1, 1, 1],
                    [2, 1, 1],
                    [3, 1, 0],
                    [2, 0, 0],
                ]) != -1
            ) {
                alert("Input matrix too powerful!");
                return cachedmatrix;
            }
            // update caches
            cachedmatrix = result;
            return result;
        } catch (error) {
            return cachedmatrix;
        }
    });
</script>

<main>
    <div class="flex-vertical">
        <h1>BMS analyzer</h1>
        <p>For TSS below (0)(1,1,1)(2,1,1)(3,1,0)(2,0,0) = EBO</p>
        <input type="text" bind:value={bmstext} />
        <!-- <div class="flex-row">
            <button title="Buchholz's Ordinal">Ω<sub>ω</sub></button>
            <button title="Bird's Ordinal">Ω<sub>Ω</sub></button>
        </div> -->
        <AnalysisCanvas {matrix} />

        <div class="margin-1">
            <h2>Notes</h2>
            <ul style="text-align: left;">
                <li>
                    Code can be found on my <a href="https://github.com/hemisemidemipresent/bms">Github</a>, this site
                    was made with svelte + vite
                </li>
                <li>
                    Much of the actual analysis code was ripped off from
                    <a href="https://solarzone1010.github.io/bms-analyzer.html">Solarzone's &lt;EBO BMS analyzer</a>
                </li>
                <li>
                    The math expressions are currently quite fucked and idk how to fix it (e.g. Ω<sub>0</sub> instead of 1)
                </li>
                <li>The css currently doesn't support super-long expressions</li>
            </ul>
        </div>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        background: var(--bg-dim);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        font-family: jetbrains, monospace;
        color: #fff;
    }
    main {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    @font-face {
        font-family: jetbrains;
        src: url("./assets/JetBrainsMono-Medium.ttf") format("truetype");
        font-style: normal;
    }
    .flex-vertical {
        display: flex;
        flex: flexbox;
        flex-direction: column;
        align-items: center;
    }
    input {
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
</style>
