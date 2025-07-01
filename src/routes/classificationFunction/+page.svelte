<script>
    import { onMount } from "svelte";

    let Plotly = null
    let plotContainer = $state()

	let surfaceTraces = $state([])
	let scatterTraces = $state([])
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
		
		surfaceTraces = newSurfaceTraces
		plotLayout.title = `クラスタリングの決定領域 (${numClusters}クラスタ)`
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
		scatterTraces = newScatterTraces
	}

	$effect(() => {
		plotData
		plotLayout
		if (Plotly === null) { return }
		Plotly.then((Plotly) => {
			Plotly.newPlot(plotContainer, plotData, plotLayout)
		})
	})

	// 共通で使うカラーパレット
	const colorPalette = [
		'rgb(214, 39, 40)', 'rgb(31, 119, 180)', 'rgb(44, 160, 44)', 
		'rgb(255, 127, 14)', 'rgb(148, 103, 189)', 'rgb(140, 86, 75)', 
		'rgb(227, 119, 194)', 'rgb(127, 127, 127)', 'rgb(188, 189, 34)', 
		'rgb(23, 190, 207)'
	];

    onMount(async() => {
        Plotly = import("plotly.js-dist")
    })
</script>

<main>
	<h1>クラスタリング可視化ツール</h1>
	<p>決定領域と、その領域に属するデータ点を3Dプロットで可視化します。</p>

	<div class="controls">
		<div class="file-control">
			<label for="boundaryFile">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="m9 15 3-3 3 3"></path></svg>
				決定領域ファイルを選択
			</label>
			<input type="file" id="boundaryFile" onchange={handleBoundaryFile}/>
			<span class="file-name"></span>
		</div>

		<div class="file-control">
			<label for="pointsFile">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="16" r="1"></circle><path d="M12 11v-1"></path></svg>
				データ点ファイルを選択
			</label>
			<input type="file" id="pointsFile" onchange={handlePointsFile}/>
			<span class="file-name"></span>
		</div>
	</div>

	<div class="plot-container" bind:this={plotContainer}></div>
</main>


<style>
    /* --- 全体のテーマとレイアウト --- */
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
			'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
		background-color: #f0f2f5;
		color: #333;
		margin: 0;
	}

	main {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	h1 {
		font-size: 2rem;
		color: #1a202c;
		border-bottom: 2px solid #e2e8f0;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
	}

	p {
		color: #718096;
		margin-bottom: 2rem;
	}

	/* --- ファイル入力コントロール --- */
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background-color: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}

	.file-control {
		position: relative;
	}

	/* ファイル選択ボタンに見えるラベル */
	.file-control label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: #4a5568;
		color: white;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: background-color 0.2s ease-in-out;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.file-control label:hover {
		background-color: #2d3748;
	}

	/* 本物のinput[type="file"]は隠す */
	.file-control input[type='file'] {
		display: none;
	}

	/* --- グラフコンテナ --- */
	.plot-container {
		width: 100%;
		/* 高さはアスペクト比で管理するとレスポンシブになりやすい */
		aspect-ratio: 4 / 3; 
		min-height: 500px;
		background-color: #fdfdff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		/* Plotlyがロードされるまでの間、中央にメッセージを表示 */
		display: flex;
		align-items: center;
		justify-content: center;
		color: #a0aec0;
	}
</style>