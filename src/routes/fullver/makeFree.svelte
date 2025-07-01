<script>
    import { onMount } from "svelte";

    let { state: configState = $bindable() } = $props()

    const psdList = [
        "nomal",
        "uniform",
        "laplace",
        "exp",
        "gamma",
        "beta",
        "chisquare"
    ]
</script>

<label>
    X axis:
    <select bind:value={configState.x.type}>
        {#each psdList as psd}
            <option value={psd}>{psd}</option>
        {/each}
    </select>
</label>

{#if configState.x.type === "nomal"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        loc:
        <input type="number" bind:value={configState.x.loc}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.x.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{:else if configState.x.type === "uniform"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        low:
        <input type="number" bind:value={configState.x.low}>
    </label>
    <br>
    <label>
        high:
        <input type="number" bind:value={configState.x.high}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{:else if configState.x.type === "laplace"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        loc:
        <input type="number" bind:value={configState.x.loc}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.x.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{:else if configState.x.type === "exp"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.x.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{:else if configState.x.type === "gamma"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        shape:
        <input type="number" bind:value={configState.x.shape}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.x.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{:else if configState.x.type === "beta"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        a:
        <input type="number" bind:value={configState.x.a}>
    </label>
    <br>
    <label>
        b:
        <input type="number" bind:value={configState.x.b}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{:else if configState.x.type === "chisquare"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        df:
        <input type="number" bind:value={configState.x.df}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.x.seed}>
    </label>
{/if}

<br>

<label>
    Y axis:
    <select bind:value={configState.y.type}>
        {#each psdList as psd}
            <option value={psd}>{psd}</option>
        {/each}
    </select>
</label>

{#if configState.y.type === "nomal"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        loc:
        <input type="number" bind:value={configState.y.loc}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.y.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{:else if configState.y.type === "uniform"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        low:
        <input type="number" bind:value={configState.y.low}>
    </label>
    <br>
    <label>
        high:
        <input type="number" bind:value={configState.y.high}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{:else if configState.y.type === "laplace"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        loc:
        <input type="number" bind:value={configState.y.loc}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.y.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{:else if configState.y.type === "exp"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.y.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{:else if configState.y.type === "gamma"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        shape:
        <input type="number" bind:value={configState.y.shape}>
    </label>
    <br>
    <label>
        scale:
        <input type="number" bind:value={configState.y.scale}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{:else if configState.y.type === "beta"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        a:
        <input type="number" bind:value={configState.y.a}>
    </label>
    <br>
    <label>
        b:
        <input type="number" bind:value={configState.y.b}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{:else if configState.y.type === "chisquare"}
    <br>
    <label>
        size:
        <input type="number" bind:value={configState.size}>
    </label>
    <br>
    <label>
        df:
        <input type="number" bind:value={configState.y.df}>
    </label>
    <br>
    <label>
        seed:
        <input type="number" bind:value={configState.y.seed}>
    </label>
{/if}

<br>