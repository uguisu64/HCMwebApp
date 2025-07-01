<script>
    import { loadPyodideInstance } from "$lib/loadPyodide";
    import { onMount } from "svelte";
    import MakeBlob from "./makeBlob.svelte";
    import MakeFree from "./makeFree.svelte";
    import DrawGraph from "./DrawGraph.svelte";
    import { calcNomal, calcUniform, calcLaplace, calcExp, calcGamma, calcBeta, calcChisquare, makeBlob } from "$lib/pythonCodes";
    import HcmModuleFactory from "$lib/wasm/hcm.mjs";
    import hcmWasmUrl from '$lib/wasm/hcm.wasm?url';
    import FcmModuleFactory from '$lib/wasm/sfcm.mjs';
    import fcmWasmUrl from '$lib/wasm/sfcm.wasm?url';

    const colorPalette = [
		'rgb(214, 39, 40)', 'rgb(31, 119, 180)', 'rgb(44, 160, 44)', 
		'rgb(255, 127, 14)', 'rgb(148, 103, 189)', 'rgb(140, 86, 75)', 
		'rgb(227, 119, 194)', 'rgb(127, 127, 127)', 'rgb(188, 189, 34)', 
		'rgb(23, 190, 207)'
	];

    const clusteringAlgorithms = [
        "HCM",
        "FCM"
    ]

    let settingObject = $state([])
    let fileName = $state("my-cluster")
    let pyodideInstance = $state(null)
    let results = $state(null)

    let hcmModule = $state()
    let hcmIsReady = $state(false)
    let fcmModule = $state()
    let fcmIsReady = $state(false)
    let fileContent = $state()
    let clusteringAlgorithm = $state(clusteringAlgorithms[0])
    let resultTexts = $state()
    $effect(async() => {
        if (!results) { return null }
        const algDict = {
            "HCM": executeHcm,
            "FCM": executeFcm
        }
        resultTexts = await algDict[clusteringAlgorithm]()
    })
    let membershipText = $derived.by(() => {
        if (!resultTexts) { return null }
        if (!Object.hasOwn(resultTexts, "mem")) { return null }
        return resultTexts.mem
    })
    let resultCentersText = $derived.by(() => {
        if (!resultTexts) { return null }
        if (!Object.hasOwn(resultTexts, "cen")) { return null }
        return resultTexts.cen
    })
    let classificationFunctionText = $derived.by(() => {
        if (!resultTexts) { return null }
        if (!Object.hasOwn(resultTexts, "cla")) { return null }
        return resultTexts.cla
    })
    let numClusters = $state(2)
    let fuzzifier = $state(2.0)
    let downloadFileNameMem = $state()
    let downloadFileNameCen = $state()
    let downloadFileNameCla = $state()

    let Plotly = null
    let plotContainer = $state()
	let surfaceTraces = $derived.by(() => {
        if (!classificationFunctionText) { return [] }
        return parseBoundaryFile(classificationFunctionText)
    })
	let scatterTraces = $derived.by(() => {
        if (!membershipText) { return [] }
        return parsePointsFile(membershipText)
    })
	let plotData = $derived([...surfaceTraces, ...scatterTraces])
    let plotLayout = $state({
		title: 'ファイルを選択してください',
		autosize: true,
		scene: {
			xaxis: { title: 'X軸' },
			yaxis: { title: 'Y軸' },
			zaxis: { title: 'Membership', range: [-0.1, 1.2] } // 点が見えるように少し範囲を広げる
		}
	})

    const psdMapping = {
        "nomal": calcNomal,
        "uniform": calcUniform,
        "laplace": calcLaplace,
        "exp": calcExp,
        "gamma": calcGamma,
        "beta": calcBeta,
        "chisquare": calcChisquare
    }

    onMount(async() => {
        Plotly = import("plotly.js-dist")
        pyodideInstance = await loadPyodideInstance()
        await pyodideInstance.loadPackage("numpy")
        await pyodideInstance.loadPackage("scikit-learn")

        hcmModule = await HcmModuleFactory({
            locateFile: (path, scriptDirectory) => {
                if (path.endsWith('.wasm')) {
                    return hcmWasmUrl
                }
                return scriptDirectory + path
            }
        });

        hcmIsReady = true

        fcmModule = await FcmModuleFactory({
            locateFile: (path, scriptDirectory) => {
                if (path.endsWith('.wasm')) {
                    return fcmWasmUrl
                }
                return scriptDirectory + path
            }
        })

        fcmIsReady = true
    })

    function addCluster() {
        const newCluster = {
            type: "makeblob",
            state: {
                size: 50,
                centerX: 0,
                centerY: 0,
                std: 0.5,
                seed: 0,
            },
            stateFree: {
                size: 50,
                x: {
                    type: "nomal",
                    seed: 0,
                    loc: 0,
                    scale: 1,
                    low: -1,
                    high: 1,
                    shape: 2.0,
                    a: 0.5,
                    b: 0.5,
                    df: 2
                },
                y: {
                    type: "nomal",
                    seed: 0,
                    loc: 0,
                    scale: 1,
                    low: -1,
                    high: 1,
                    shape: 2.0,
                    a: 0.5,
                    b: 0.5,
                    df: 2
                },
            }
        }
        settingObject.push(newCluster)
    }

    $effect(async() => {
        if (settingObject.length < 1) { return }
        JSON.stringify(settingObject)
        results = await generateData(settingObject)
        fileContent = createDataFileContent()
    })

    $effect(() => {
		plotData
		plotLayout
		if (Plotly === null) { return }
		Plotly.then((Plotly) => {
			Plotly.newPlot(plotContainer, plotData, plotLayout)
		})
	})

    async function generateData(settingObject) {
        const res = await Promise.all(settingObject.map(async(obj, i) => {
            if (obj.type === "makeblob") {
                let context = pyodideInstance.toPy(obj.state)
                const resPy = await pyodideInstance.runPythonAsync(makeBlob, { globals: context})
                const res = {...resPy.toJs({ dict_converter: Object.fromEntries }), i: i}
                return res
            }
            else if (obj.type === "free") {
                const contextX = pyodideInstance.toPy({...obj.stateFree.x, size: obj.stateFree.size})
                const resX = await pyodideInstance.runPythonAsync(psdMapping[obj.stateFree.x.type], {globals: contextX})
                const contextY = pyodideInstance.toPy({...obj.stateFree.y, size: obj.stateFree.size})
                const resY = await pyodideInstance.runPythonAsync(psdMapping[obj.stateFree.y.type], {globals: contextY})
                const res = { x: resX.toJs({ dict_converter: Object.fromEntries }), y: resY.toJs({ dict_converter: Object.fromEntries }), i: i}
                return res
            }
        }))
        return res
    }

    function createDataFileContent() {
        const allPoints = [];

        results.forEach(cluster => {
            for (let i = 0; i < cluster.x.length; i++) {
                allPoints.push([cluster.x[i], cluster.y[i]]);
            }
        });

        let content = `${allPoints.length}\t2\n`;
        const pointLines = allPoints.map(p => `${p[0]}\t${p[1]}`);
        content += pointLines.join('\n');
        
        return content;
    }

    function createLabelFileContent() {
        const allLabels = [];
        results.forEach(cluster => {
            for (let i = 0; i < cluster.x.length; i++) {
                allLabels.push(cluster.i);
            }
        });

        const numClusters = results.length;
        const lines = [];

        for (let k = 0; k < numClusters; k++) {
            const membershipRow = allLabels.map(label => (label === k ? 1 : 0));
            
            lines.push(membershipRow.join(' '));
        }
        
        return lines.join('\n');
    }

    function triggerDownload(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleDataDownload() {
        const fileContent = createDataFileContent();
        triggerDownload(fileContent, `${fileName}.dat`, 'text/plain');
    }

    function handleLabelDownload() {
        const fileContent = createLabelFileContent();
        triggerDownload(fileContent, `${fileName}.correctCrispMembership`, 'text/plain');
    }

    async function executeHcm() {
        if (!hcmIsReady || !fileContent) {
            return
        }

        const inputFilename = "my_data.dat"

        hcmModule.FS.writeFile(inputFilename, fileContent)

        console.log("Executing HCM...")
        hcmModule.callMain([inputFilename, String(numClusters)])
        console.log("Execution finished.")

        const resultMembershipFilename = `HCM-${inputFilename.split('.')[0]}.result_membership`
        const resultCentersFilename = `HCM-${inputFilename.split('.')[0]}.result_centers`
        const resultClassificationFunction = `HCM-${inputFilename.split('.')[0]}.result_classificationFunction`

        let membershipResultText
        let resultCentersResultText
        let classificationFunctionResultText

        try {
            membershipResultText = hcmModule.FS.readFile(resultMembershipFilename, { encoding: 'utf8' })
            resultCentersResultText = hcmModule.FS.readFile(resultCentersFilename, { encoding: 'utf8' })
            classificationFunctionResultText = hcmModule.FS.readFile(resultClassificationFunction, { encoding: 'utf8' })

        } catch (e) {
            console.error("Could not read result file.", e)
        }

        hcmModule.FS.unlink(inputFilename)
        hcmModule.FS.unlink(resultMembershipFilename)
        hcmModule.FS.unlink(resultCentersFilename)

        return {mem: membershipResultText, cen: resultCentersResultText, cla: classificationFunctionResultText}
    }

    async function executeFcm() {
        if (!fcmIsReady || !fileContent) {
            return
        }

        const inputFilename = "my_data.dat"

        fcmModule.FS.writeFile(inputFilename, fileContent)
        
        console.log("Executing FCM...")
        fcmModule.callMain([inputFilename, String(numClusters), String(fuzzifier)])
        console.log("Execution finished.")

        const resultMembershipFilename = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_membership`
        const resultCentersFilename = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_centers`
        const resultClassificationFunction = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_classificationFunction`

        let membershipResultText
        let resultCentersResultText
        let classificationFunctionResultText

        try {
            membershipResultText = fcmModule.FS.readFile(resultMembershipFilename, { encoding: 'utf8' })
            resultCentersResultText = fcmModule.FS.readFile(resultCentersFilename, { encoding: 'utf8' })
            classificationFunctionResultText = fcmModule.FS.readFile(resultClassificationFunction, { encoding: 'utf8' })
        } catch (e) {
            console.error("Could not read result file.", e)
        }

        fcmModule.FS.unlink(inputFilename)
        fcmModule.FS.unlink(resultMembershipFilename)
        fcmModule.FS.unlink(resultCentersFilename)

        return {mem: membershipResultText, cen: resultCentersText, cla: classificationFunctionResultText}
    }

    function fileHandler(event) {
        const file = event.target.files[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (e) => {fileContent = e.target.result}
		reader.readAsText(file)
    }

    function handleBoundaryFile(event) {
		const file = event.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => parseBoundaryFile(e.target.result);
		reader.readAsText(file);
	}

	function parseBoundaryFile(text) {
		const lines = text.trim().split('\n').filter((line) => line.trim() !== '');
		if (lines.length === 0) return;
		const firstLineCols = lines[0].trim().split(/\s+/);
		const numClusters = firstLineCols.length - 3;
		if (numClusters < 1) return;

		const xCoords = new Set();
		const yCoords = new Set();
		const points = [];
		lines.forEach((line) => {
			const cols = line.trim().split(/\s+/);
			if (cols.length !== numClusters + 3) return;
			const x = parseFloat(cols[0]);
			const y = parseFloat(cols[1]);
			const clusterMembership = []
			for (let i = 0; i < numClusters; i++) {
				clusterMembership.push(parseFloat(cols[i + 2]))
			}
			xCoords.add(x);
			yCoords.add(y);
			points.push({ x, y, clusterMembership });
		});

		const sortedX = Array.from(xCoords).sort((a, b) => a - b);
		const sortedY = Array.from(yCoords).sort((a, b) => a - b);
		
		const zDataByCluster = [];
		for (let i = 0; i < numClusters; i++) {
			zDataByCluster.push(Array(sortedY.length).fill(null).map(() => Array(sortedX.length).fill(0)));
		}
		points.forEach((p) => {
			p.clusterMembership.forEach((membership, i) => {
				zDataByCluster[i][sortedY.indexOf(p.y)][sortedX.indexOf(p.x)] = membership
			})
		});

		const newSurfaceTraces = [];
		for (let i = 0; i < numClusters; i++) {
			const color = colorPalette[i % colorPalette.length]
			newSurfaceTraces.push({
				x: sortedX,
				y: sortedY,
				z: zDataByCluster[i],
				type: 'surface', name: `Cluster ${i + 1}`,
				colorscale: [[0, color], [1, color]], showscale: false
			})
		}
		
		return newSurfaceTraces
	}

	function handlePointsFile(event) {
		const file = event.target.files[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (e) => parsePointsFile(e.target.result)
		reader.readAsText(file)
	}


	function parsePointsFile(text) {
		const pointsByCluster = new Map()
		const lines = text.trim().split('\n')
		
		lines.forEach(line => {
			const cols = line.trim().split(/\s+/)
			if (cols.length < 3) return
			
			const point = { x: parseFloat(cols[0]), y: parseFloat(cols[1]) }
			let clusterId = 0
			let tmpmax = cols[2]
			let tmpindex = 2
			for (let i = 2; i < cols.length; i++) {
				if (cols[i] > tmpmax) {
					tmpmax = cols[i]
					tmpindex = i
				}
			}
			point["z"] = tmpmax
			point["clusterId"] = tmpindex

			if (!pointsByCluster.has(clusterId)) {
				pointsByCluster.set(clusterId, { x: [], y: [], z: [] })
			}
			const clusterData = pointsByCluster.get(clusterId)
			clusterData.x.push(point.x)
			clusterData.y.push(point.y)
			clusterData.z.push(point.z)
		});
		
		const newScatterTraces = [];
		for (const [clusterId, data] of pointsByCluster.entries()) {
			newScatterTraces.push({
				...data,
				mode: 'markers',
				type: 'scatter3d',
				name: `Data (Cluster ${clusterId})`,
				marker: { 
					color: colorPalette[clusterId - 1 % colorPalette.length],
					size: 5, // 少し大きく
					line: {
						color: 'rgba(255, 255, 255, 0.8)', // 白い縁取り
						width: 1
					}
				}
			})
		}
		return newScatterTraces
	}
</script>

<div class="workbench-layout">

    <div class="panel data-settings-panel">
        
        <div class="card">
            <h3>データ生成設定</h3>
            {#each settingObject as set, i}
                <div class="cluster-config-item">
                    <div class="cluster-header">
                        <h4>Cluster {i + 1}</h4>
                        <select bind:value={set.type}>
                            <option value="makeblob">MakeBlob</option>
                            <option value="free">FreeForm</option>
                        </select>
                    </div>
                    {#if set.type === "makeblob"}
                        <MakeBlob bind:state={set.state}></MakeBlob>
                    {:else}
                        <MakeFree bind:state={set.stateFree}></MakeFree>
                    {/if}
                </div>
            {/each}
            
            <button class="add-cluster-btn" onclick={addCluster}>+ クラスタを追加</button>
        </div>

        <div class="card">
            <h3>データのエクスポート</h3>
            <div class="form-group">
                <label>
                    ファイル名
                    <input type="text" bind:value={fileName} placeholder="my-cluster">
                </label>
            </div>
            <div class="button-group">
                <button onclick={handleDataDownload}>Data (.dat)</button>
                <button onclick={handleLabelDownload}>Labels (.txt)</button>
            </div>
        </div>

    </div>

    <div class="panel visualization-panel" bind:this={plotContainer}>
        </div>


    <div class="panel clustering-results-panel">

        <div class="card">
            <h3>クラスタリング実行</h3>
            <div class="form-group">
                <label>
                    アルゴリズム
                    <select bind:value={clusteringAlgorithm}>
                        {#each clusteringAlgorithms as c}
                            <option value={c}>{c}</option>
                        {/each}
                    </select>
                </label>
            </div>

            {#if clusteringAlgorithm === "HCM"}
                <div class="form-group">
                    <label>クラスタ数: <input type="number" bind:value={numClusters} min="1"></label>
                </div>
            {:else if clusteringAlgorithm === "FCM"}
                <div class="form-group">
                    <label>クラスタ数: <input type="number" bind:value={numClusters} min="1"></label>
                    <label>ファジー化係数: <input type="number" bind:value={fuzzifier} min="1.1" step="0.1"></label>
                </div>
            {/if}
        </div>

        <div class="card">
            <h3>実行結果</h3>
            <div class="result-item">
                <label for="membership-text">Membership:</label>
                <textarea id="membership-text" readonly bind:value={membershipText} rows="8"></textarea>
                <div class="download-section">
                    <input type="text" placeholder="membership.txt" bind:value={downloadFileNameMem}>
                    <button onclick={() => triggerDownload(membershipText, downloadFileNameMem || 'membership.txt', 'text/plain')} disabled={!membershipText}>
                        Download
                    </button>
                </div>
            </div>
            
            <div class="result-item">
                <label for="centers-text">Centers:</label>
                <textarea id="centers-text" readonly bind:value={resultCentersText} rows="4"></textarea>
                <div class="download-section">
                    <input type="text" placeholder="centers.txt" bind:value={downloadFileNameCen}>
                    <button onclick={() => triggerDownload(resultCentersText, downloadFileNameCen || 'centers.txt', 'text/plain')} disabled={!resultCentersText}>
                        Download
                    </button>
                </div>
            </div>

            <div class="result-item">
                <label for="classification-text">Classification Function:</label>
                <textarea id="classification-text" readonly bind:value={classificationFunctionText} rows="8"></textarea>
                <div class="download-section">
                    <input type="text" placeholder="classification.txt" bind:value={downloadFileNameCla}>
                    <button onclick={() => triggerDownload(classificationFunctionText, downloadFileNameCla || 'classification.txt', 'text/plain')} disabled={!classificationFunctionText}>
                        Download
                    </button>
                </div>
            </div>
        </div>

    </div>
</div>

<style>
    /* --- グローバルとレイアウト --- */
    :global(body) {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f0f2f5;
        margin: 0;
        color: #333;
    }

    .workbench-layout {
        display: grid;
        grid-template-columns: 350px 1fr 400px; /* 左, 中央, 右カラムの幅 */
        gap: 24px;
        padding: 24px;
        height: 100vh;
        box-sizing: border-box;
    }

    .panel {
        display: flex;
        flex-direction: column;
        gap: 24px; /* パネル内のカード間の隙間 */
        overflow-y: auto; /* 内容がはみ出たらスクロール */
    }

    /* グラフ表示エリアは背景や余白をなくす */
    .visualization-panel {
        padding: 0;
        background-color: transparent;
        border-radius: 8px;
        overflow: hidden; /* Plotlyがはみ出ないように */
    }


    /* --- カードUIスタイル --- */
    .card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        flex-shrink: 0; /* スクロール時にカードが縮まないように */
    }

    .card h3, .card h4 {
        margin-top: 0;
        margin-bottom: 16px;
    }
    .card h3 {
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
    }

    /* --- データ生成アイテムのスタイル --- */
    .cluster-config-item {
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
    }
    .cluster-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    .cluster-header h4 {
        margin: 0;
    }


    /* --- フォームとボタンの共通スタイル --- */
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 16px;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-weight: 500;
        font-size: 0.9rem;
    }

    input[type="number"],
    input[type="text"],
    select {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    button {
        padding: 10px 15px;
        border: none;
        background-color: #007bff;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    button:hover:not(:disabled) {
        background-color: #0056b3;
    }
    button:disabled {
        background-color: #a0c7e4;
        cursor: not-allowed;
    }

    .button-group {
        display: flex;
        gap: 12px;
    }
    .add-cluster-btn {
        width: 100%;
        background-color: #28a745;
    }
    .add-cluster-btn:hover {
        background-color: #218838;
    }

    /* --- 結果表示とダウンロードセクション --- */
    .result-item {
        margin-bottom: 20px;
    }
    textarea {
        width: 100%;
        box-sizing: border-box;
        font-family: 'Courier New', Courier, monospace;
        background-color: #f8f9fa;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 8px;
        font-size: 0.9rem;
        resize: vertical;
    }

    .download-section {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }
    .download-section input {
        flex-grow: 1;
    }
    .download-section button {
        width: auto;
        flex-shrink: 0;
    }
</style>