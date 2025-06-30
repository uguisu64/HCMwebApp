<script>
    import { onMount } from 'svelte';
    import HcmModuleFactory from "$lib/wasm/hcm.mjs";
    import hcmWasmUrl from '$lib/wasm/hcm.wasm?url';
    import FcmModuleFactory from '$lib/wasm/sfcm.mjs';
    import fcmWasmUrl from '$lib/wasm/sfcm.wasm?url';

    let hcmModule = $state()
    let hcmIsReady = $state(false)
    let fcmModule = $state()
    let fcmIsReady = $state(false)
    let fileContent = $state()
    let membershipText = $state()
    let resultCentersText = $state()
    let classificationFunctionText = $state()
    let numClusters = $state(2)
    let fuzzifier = $state(2.0)
    let downloadFileNameMem = $state()
    let downloadFileNameCen = $state()
    let downloadFileNameCla = $state()

    onMount(async() => {
        hcmModule = await HcmModuleFactory({
            locateFile: (path, scriptDirectory) => {
                // .wasmファイルを探すように要求されたら、Viteが解決したURLを返す
                if (path.endsWith('.wasm')) {
                    return hcmWasmUrl
                }
                return scriptDirectory + path
            }
        });

        hcmIsReady = true

        fcmModule = await FcmModuleFactory({
            locateFile: (path, scriptDirectory) => {
                // .wasmファイルを探すように要求されたら、Viteが解決したURLを返す
                if (path.endsWith('.wasm')) {
                    return fcmWasmUrl
                }
                return scriptDirectory + path
            }
        })

        fcmIsReady = true
    });

    async function executeHcm() {
        if (!hcmIsReady || !fileContent) {
            alert("WASM is not ready.")
            return
        }

        const inputFilename = "my_data.dat"

        // 2. 仮想ファイルシステムに入力ファイルを書き込む
        console.log(fileContent)
        hcmModule.FS.writeFile(inputFilename, fileContent)

        console.log("Executing HCM...")
        // 3. WASMのmain関数をコマンドライン引数付きで実行
        hcmModule.callMain([inputFilename, String(numClusters)])
        console.log("Execution finished.")

        // 4. WASMが生成した結果ファイルを読み出す
        const resultMembershipFilename = `HCM-${inputFilename.split('.')[0]}.result_membership`
        const resultCentersFilename = `HCM-${inputFilename.split('.')[0]}.result_centers`
        const resultClassificationFunction = `HCM-${inputFilename.split('.')[0]}.result_classificationFunction`

        try {
            membershipText = hcmModule.FS.readFile(resultMembershipFilename, { encoding: 'utf8' })
            resultCentersText = hcmModule.FS.readFile(resultCentersFilename, { encoding: 'utf8' })
            classificationFunctionText = hcmModule.FS.readFile(resultClassificationFunction, { encoding: 'utf8' })

        } catch (e) {
            console.error("Could not read result file.", e)
        }

        hcmModule.FS.unlink(inputFilename)
        hcmModule.FS.unlink(resultMembershipFilename)
        hcmModule.FS.unlink(resultCentersFilename)
    }

    async function executeFcm() {
        if (!fcmIsReady || !fileContent) {
            alert("WASM is not ready.")
            return
        }

        const inputFilename = "my_data.dat"

        // 2. 仮想ファイルシステムに入力ファイルを書き込む
        console.log(fileContent)
        fcmModule.FS.writeFile(inputFilename, fileContent)
        
        console.log("Executing FCM...")
        // 3. WASMのmain関数をコマンドライン引数付きで実行
        fcmModule.callMain([inputFilename, String(numClusters), String(fuzzifier)])
        console.log("Execution finished.")

        // 4. WASMが生成した結果ファイルを読み出す
        const resultMembershipFilename = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_membership`
        const resultCentersFilename = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_centers`
        const resultClassificationFunction = `sFCM-Em${fuzzifier.toFixed(6)}-${inputFilename.split('.')[0]}.result_classificationFunction`

        try {
            membershipText = fcmModule.FS.readFile(resultMembershipFilename, { encoding: 'utf8' })
            resultCentersText = fcmModule.FS.readFile(resultCentersFilename, { encoding: 'utf8' })
            classificationFunctionText = fcmModule.FS.readFile(resultClassificationFunction, { encoding: 'utf8' })
        } catch (e) {
            console.error("Could not read result file.", e)
        }

        fcmModule.FS.unlink(inputFilename)
        fcmModule.FS.unlink(resultMembershipFilename)
        fcmModule.FS.unlink(resultCentersFilename)
    }

    function fileHandler(event) {
        const file = event.target.files[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (e) => {fileContent = e.target.result}
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
            <input type="file" onchange={fileHandler}>
        </div>

        <div class="card">
            <h4>HCM (Hard C-Means)</h4>
            <div class="form-group">
                <label>
                    クラスタ数
                    <input type="number" bind:value={numClusters} min="1">
                </label>
            </div>
            <button onclick={executeHcm} disabled={!hcmIsReady || !fileContent}>
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
            <button onclick={executeFcm} disabled={!fcmIsReady || !fileContent}>
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
                <label for="classification-text">Classification Function:</label>
                <textarea id="classification-text" readonly bind:value={classificationFunctionText} rows="10"></textarea>
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
    .page-container {
    display: grid;
    /* 左に400pxの固定幅、右は残り全部(1fr)、間に24pxの隙間 */
    grid-template-columns: 400px 1fr;
    gap: 24px;
    padding: 24px;
    height: 100vh;
    box-sizing: border-box;
    }

    .controls-panel, .results-panel {
        display: flex;
        flex-direction: column;
        gap: 24px; /* カード間の隙間 */
        overflow-y: auto; /* 内容が多ければスクロール */
    }

    /* --- カードUIスタイル --- */
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


    /* --- フォーム要素のスタイル --- */
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


    /* --- 結果表示とダウンロードセクションのスタイル --- */
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
        flex-grow: 1; /* 入力欄を可能な限り広げる */
    }

    .download-section button {
        width: auto; /* ボタンの幅をコンテンツに合わせる */
        flex-shrink: 0;
    }
</style>