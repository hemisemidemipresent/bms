<script>
    import MathExpr from "./MathExpr.svelte";
    const { obj } = $props();
    import { iz, add, exp, eq, l, lt, log, s, ZERO, ONE } from "./BMSUtil.js";

    // [a,b,c] = c + ψ_a(b)
    // or is it [a,b,c] = ψ_a(b) + c?
    function getCoef(x) {
        if (iz(x[2])) {
            return 1;
        }
        return getCoef(x[2]) + 1;
    }
</script>

{#if iz(obj)}
    <span>0</span>
{:else if iz(obj[0]) && iz(obj[1])}
    <span>{getCoef(obj)}</span>
{:else}
    {@const [a, b] = s(obj, [obj[0], obj[1], []])}
    <span>
        {#if eq(a[0], []) && eq(a[1], ONE)}
            ω
        {:else if iz(a[1]) && eq(a[0], ONE)}
            Ω
        {:else if iz(a[1])}
            Ω<sub><MathExpr obj={a[0]} /></sub>
            <!-- {:else if iz(a[0])} -->
            <!-- ψ<sub>0</sub>(<MathExpr obj={a[1]} />) -->
        {:else if !eq(log([a[0], a[1], []]), [a[0], a[1], []]) && lt(log(a), [ONE, ZERO, ZERO])}
            ω<sup><MathExpr obj={log(a)} /></sup>
        {:else}
            ψ<sub><MathExpr obj={a[0]} /></sub>(<MathExpr obj={a[1]} />)
        {/if}{#if getCoef(a) > 1}
            {getCoef(a)}
        {/if}{#if !iz(b)}
            +<MathExpr obj={b} />
        {/if}
    </span>
{/if}

<style>
    span {
        display: inline;
        white-space-collapse: collapse; /*prevent line breaks from showing up as spaces*/
    }
    sub,
    sup {
        display: inline;
        white-space-collapse: collapse; /*prevent line breaks from showing up as spaces*/
    }
</style>
