<script>
    import MathExpr from "./MathExpr.svelte";
    const { analyzedMatrix } = $props();
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
            <tr
                class={`${col.upgraderType || ""} ${!analyzedMatrix.colInfo[i].isOrdinalValueCounted ? "value-unused" : ""}`}
            >
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

<style>
    tbody > .simple {
        color: var(--yellow);
        background: var(--bg-yellow);
    }
    tbody > .ancestor {
        color: var(--green);
        background: var(--bg-green);
    }
</style>
