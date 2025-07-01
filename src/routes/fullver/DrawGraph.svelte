<script>
    import { onMount } from "svelte";

    let { results } = $props()

    onMount(async() => {
        let plotly = await import("plotly.js-dist")
        const datas = results.map((r, i) => {
            return {
                x: r.x,
                y: r.y,
                mode: "markers",
                type: "scatter",
                name: i,
            }
        })
        const layout = {
            title: "sccater of artificial data"
        }
        plotly.newPlot('myPlot', datas, layout)
    })
</script>

<div id="myPlot"></div>

<style>
    #myPlot {
        width: 100%;
        height: 100%;
        min-height: 200px;
    }
</style>