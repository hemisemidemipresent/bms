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
        <input type="text" bind:value={bmstext} />
        <!-- <Table {matrix} /> -->
        <AnalysisCanvas {matrix} />
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
