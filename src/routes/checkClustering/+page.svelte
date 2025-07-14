<script>
    import { onMount } from 'svelte';
    import CheckHcmModuleFactory from "$lib/wasm/hcm_check.mjs";
    import checkHcmWasmUrl from '$lib/wasm/hcm_check.wasm?url';
    import CheckFcmModuleFactory from '$lib/wasm/sfcm_check.mjs';
    import checkFcmWasmUrl from '$lib/wasm/sfcm_check.wasm?url';

    let checkHcmModule = $state()
    let checkHcmIsReady = $state(false)
    let checkFcmModule = $state()
    let checkFcmIsReady = $state(false)
    let fileContent = $state()
    let groundTruthFileContent = $state()
    let membershipText = $state()
    let resultCentersText = $state()
    let contingencyTable = $state([])
    let ariScore = $state(null)
    let rawAriOutput = $state('')
    let numClusters = $state(2)
    let fuzzifier = $state(2.0)
    let downloadFileNameMem = $state()
    let downloadFileNameCen = $state()
    let stdoutBuffer = $state('');

    onMount(async() => {
        checkHcmModule = await CheckHcmModuleFactory({
            locateFile: (path, scriptDirectory) => {
                if (path.endsWith('.wasm')) return checkHcmWasmUrl
                return scriptDirectory + path
            },
            print: (text) => { stdoutBuffer += text + '\n'; },
            printErr: (text) => { stdoutBuffer += text + '\n'; }
        });
        checkHcmIsReady = true

        checkFcmModule = await CheckFcmModuleFactory({
            locateFile: (path, scriptDirectory) => {
                if (path.endsWith('.wasm')) return checkFcmWasmUrl
                return scriptDirectory + path
            },
            print: (text) => { stdoutBuffer += text + '\n'; },
            printErr: (text) => { stdoutBuffer += text + '\n'; }
        })
        checkFcmIsReady = true
    });

    function parseAriOutput(output) {
        const lines = output.split('\n');
        let rawTable = [];
        let score = null;
        let parsingTable = false;

        for (const line of lines) {
            if (line.startsWith('Contingency Table:')) {
                parsingTable = true;
                continue;
            }
            if (line.startsWith('ARI:')) {
                parsingTable = false;
                score = parseFloat(line.replace('ARI:', '').trim());
                continue;
            }
            if (parsingTable && line.trim()) {
                const row = line.replace(/[()]/g, '').trim().split(',').map(s => s.trim()).filter(s => s).map(s => parseInt(s, 10));
                if (row.length > 0) {
                    rawTable.push(row);
                }
            }
        }

        if (rawTable.length > 1) {
            // Exclude last row (totals)
            const tableWithoutTotals = rawTable.slice(0, -1);
            // Exclude last column (totals) from each remaining row
            contingencyTable = tableWithoutTotals.map(row => row.slice(0, -1));
        } else {
            contingencyTable = [];
        }

        ariScore = score;
    }

    async function executeHcm() {
        if (!checkHcmIsReady || !fileContent || !groundTruthFileContent) {
            alert("WASM is not ready or files are not loaded.")
            return
        }

        const inputFilename = "my_data.dat"
        const groundTruthFilename = "my_ground_truth.dat"

        checkHcmModule.FS.writeFile(inputFilename, fileContent)
        checkHcmModule.FS.writeFile(groundTruthFilename, groundTruthFileContent)

        stdoutBuffer = '';
        contingencyTable = [];
        ariScore = null;

        console.log("Executing Check HCM...")
        checkHcmModule.callMain([inputFilename, groundTruthFilename, String(numClusters)])
        console.log("Execution finished.")
        
        rawAriOutput = stdoutBuffer;
        parseAriOutput(stdoutBuffer);

        const resultMembershipFilename = `HCM-${inputFilename.split('.')[0]}.result_membership`
        const resultCentersFilename = `HCM-${inputFilename.split('.')[0]}.result_centers`

        try {
            membershipText = checkHcmModule.FS.readFile(resultMembershipFilename, { encoding: 'utf8' })
            resultCentersText = checkHcmModule.FS.readFile(resultCentersFilename, { encoding: 'utf8' })
        } catch (e) {
            console.error("Could not read result file.", e)
        }

        checkHcmModule.FS.unlink(inputFilename)
        checkHcmModule.FS.unlink(groundTruthFilename)
        checkHcmModule.FS.unlink(resultMembershipFilename)
        checkHcmModule.FS.unlink(resultCentersFilename)
    }

    async function executeFcm() {
        if (!checkFcmIsReady || !fileContent || !groundTruthFileContent) {
            alert("WASM is not ready or files are not loaded.")
            return
        }

        const inputFilename = "my_data.dat"
        const groundTruthFilename = "my_ground_truth.dat"

        checkFcmModule.FS.writeFile(inputFilename, fileContent)
        checkFcmModule.FS.writeFile(groundTruthFilename, groundTruthFileContent)
        
        stdoutBuffer = '';
        contingencyTable = [];
        ariScore = null;

        console.log("Executing Check FCM...")
        checkFcmModule.callMain([inputFilename, groundTruthFilename, String(numClusters), String(fuzzifier)])
        console.log("Execution finished.")
        
        rawAriOutput = stdoutBuffer;
        parseAriOutput(stdoutBuffer);

        const resultMembershipFilename = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_membership`
        const resultCentersFilename = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_centers`

        try {
            membershipText = checkFcmModule.FS.readFile(resultMembershipFilename, { encoding: 'utf8' })
            resultCentersText = checkFcmModule.FS.readFile(resultCentersFilename, { encoding: 'utf8' })
        } catch (e) {
            console.error("Could not read result file.", e)
        }

        checkFcmModule.FS.unlink(inputFilename)
        checkFcmModule.FS.unlink(groundTruthFilename)
        checkFcmModule.FS.unlink(resultMembershipFilename)
        checkFcmModule.FS.unlink(resultCentersFilename)
    }

    function fileHandler(event) {
        const file = event.target.files[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (e) => {fileContent = e.target.result}
		reader.readAsText(file)
    }

    function groundTruthFileHandler(event) {
        const file = event.target.files[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (e) => {groundTruthFileContent = e.target.result}
		reader.readAsText(file)
    }

    function triggerDownload(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
</script>

<div class="page-container">

    <div class="controls-panel">
        
        <div class="card">
            <h3>Import & Settings</h3>
            <div class="form-group">
                <label>
                    Data File
                    <input type="file" onchange={fileHandler}>
                </label>
                <label>
                    Ground Truth Label File
                    <input type="file" onchange={groundTruthFileHandler}>
                </label>
            </div>
        </div>

        <div class="card">
            <h4>HCM (Hard C-Means)</h4>
            <div class="form-group">
                <label>
                    クラスタ数
                    <input type="number" bind:value={numClusters} min="1">
                </label>
            </div>
            <button onclick={executeHcm} disabled={!checkHcmIsReady || !fileContent || !groundTruthFileContent}>
                Run HCM Clustering
            </button>
        </div>
        
        <div class="card">
            <h4>FCM (Fuzzy C-Means)</h4>
            <div class="form-group">
                <label>
                    クラスタ数
                    <input type="number" bind:value={numClusters} min="1">
                </label>
                <label>
                    ファジー化係数
                    <input type="number" bind:value={fuzzifier} min="1.1" step="0.1">
                </label>
            </div>
            <button onclick={executeFcm} disabled={!checkFcmIsReady || !fileContent || !groundTruthFileContent}>
                Run FCM Clustering
            </button>
        </div>

    </div>

    <div class="results-panel">
        <div class="card">
            <h3>Results</h3>
            
            <div class="result-item">
                <label for="membership-text">Membership:</label>
                <textarea id="membership-text" readonly bind:value={membershipText} rows="10"></textarea>
                <div class="download-section">
                    <input type="text" placeholder="membership.txt" bind:value={downloadFileNameMem}>
                    <button onclick={() => triggerDownload(membershipText, downloadFileNameMem || 'membership.txt', 'text/plain')} disabled={!membershipText}>
                        Download
                    </button>
                </div>
            </div>

            <div class="result-item">
                <label for="centers-text">Centers:</label>
                <textarea id="centers-text" readonly bind:value={resultCentersText} rows="5"></textarea>
                <div class="download-section">
                    <input type="text" placeholder="centers.txt" bind:value={downloadFileNameCen}>
                    <button onclick={() => triggerDownload(resultCentersText, downloadFileNameCen || 'centers.txt', 'text/plain')} disabled={!resultCentersText}>
                        Download
                    </button>
                </div>
            </div>

            <div class="result-item">
                <h4>Clustering Evaluation</h4>
                {#if ariScore !== null}
                    <p><strong>Adjusted Rand Index (ARI):</strong> {ariScore.toFixed(6)}</p>
                {/if}

                {#if contingencyTable && contingencyTable.length > 0}
                    <label for="contTable">Contingency Table:</label>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ARI: {ariScore.toFixed(6)}</th>
                                    {#each contingencyTable[0] as _, i}
                                        <th>True {i + 1}</th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody>
                                {#each contingencyTable as row, i}
                                    <tr>
                                        <th>Predict {i + 1}</th>
                                        {#each row as cell}
                                            <td>{cell}</td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>

            <div class="result-item">
                <label for="ari-raw-output">Raw Standard Output:</label>
                <textarea id="ari-raw-output" readonly bind:value={rawAriOutput} rows="10"></textarea>
            </div>

        </div>
    </div>

</div>

<style>
    .page-container {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 24px;
    padding: 24px;
    height: 100vh;
    box-sizing: border-box;
    }

    .controls-panel, .results-panel {
        display: flex;
        flex-direction: column;
        gap: 24px;
        overflow-y: auto;
    }

    .card {
        background: #ffffff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }

    .card h3 {
        margin-top: 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
    }
    .card h4 {
        margin-top: 0;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
    }

    label {
        display: flex;
        flex-direction: column;
        font-weight: 500;
        font-size: 0.9rem;
        color: #333;
    }

    input[type="number"],
    input[type="text"],
    input[type="file"] {
        margin-top: 4px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    button {
        width: 100%;
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

    .result-item {
        margin-bottom: 24px;
    }

    .result-item label {
        margin-bottom: 8px;
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
    }

    .download-section {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }

    .download-section input[type="text"] {
        flex-grow: 1;
    }

    .download-section button {
        width: auto;
        flex-shrink: 0;
    }

    .table-container {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
    }

    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: right;
    }

    th {
        background-color: #f2f2f2;
        font-weight: bold;
    }

    tbody th {
        text-align: left;
    }
</style>