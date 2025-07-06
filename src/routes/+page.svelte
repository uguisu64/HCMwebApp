<div class="top-page-container">
    
    <header class="hero-section">
        <h1>インタラクティブ・クラスタリング分析ツール</h1>
        <p>
            C++/WebAssembly, Pyodide, SvelteKit を活用した、ブラウザ完結型のクラスタリング探求環境。
        </p>
        <a href="./fullver" class="hero-button">フルバージョンを試す</a>
    </header>

    <main class="features-grid">
        
        <div class="feature-card">
            <span class="icon">📊</span>
            <h3>Execute Clustering</h3>
            <p>既存のデータファイルをアップロードし、HCM/FCMクラスタリングを実行。結果をテキストで確認・ダウンロードできます。</p>
            <a href="./executeClustering" class="card-button">ツールへ</a>
        </div>
        
        <div class="feature-card">
            <span class="icon">🎨</span>
            <h3>Plot classificationFunction</h3>
            <p>クラスタリングによって得られた識別関数の結果ファイルをアップロードし、3Dサーフェスプロットとして可視化します。</p>
            <a href="./classificationFunction" class="card-button">ツールへ</a>
        </div>

        <div class="feature-card">
            <span class="icon">🚀</span>
            <h3>Full Version</h3>
            <p>人工データのインタラクティブな生成から、クラスタリング実行、3Dでの結果可視化までを一気通貫で行えます。</p>
            <a href="./fullver" class="card-button">ツールへ</a>
        </div>

        <div class="feature-card">
            <span class="icon">🧪</span>
            <h3>Check Clustering</h3>
            <p>クラスタリング結果を正解ラベルと比較し、ARI (Adjusted Rand Index) などの評価指標を確認できます。</p>
            <a href="./checkClustering" class="card-button">ツールへ</a>
        </div>

    </main>

    <section class="tech-stack">
        <h4>Powered by:</h4>
        <div class="logos">
            <span>SvelteKit</span>
            <span>WebAssembly</span>
            <span>Pyodide</span>
            <span>Plotly.js</span>
        </div>
    </section>

</div>

<style>
    /* --- 全体とヒーローセクション --- */
    .top-page-container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #333;
    }

    .hero-section {
        text-align: center;
        padding: 4rem 0;
        border-bottom: 1px solid #e0e0e0;
    }

    .hero-section h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .hero-section p {
        font-size: 1.2rem;
        color: #555;
        margin-bottom: 2rem;
    }

    .hero-button {
        display: inline-block;
        padding: 12px 28px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        font-size: 1.1rem;
        font-weight: bold;
        border-radius: 8px;
        transition: transform 0.2s, background-color 0.2s;
    }
    .hero-button:hover {
        background-color: #0056b3;
        transform: translateY(-2px);
    }


    /* --- 機能紹介カード --- */
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        padding: 3rem 0;
    }

    .feature-card {
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        transition: box-shadow 0.3s, transform 0.3s;
        display: flex;
        flex-direction: column;
    }

    .feature-card:hover {
        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        transform: translateY(-5px);
    }

    .feature-card .icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .feature-card h3 {
        margin-bottom: 1rem;
    }

    .feature-card p {
        color: #666;
        flex-grow: 1; /* 説明文の高さを揃える */
    }

    .card-button {
        margin-top: 1.5rem;
        display: inline-block;
        padding: 10px 20px;
        background-color: #f0f0f0;
        color: #333;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        transition: background-color 0.2s;
    }
    .card-button:hover {
        background-color: #e0e0e0;
    }


    /* --- 技術スタック --- */
    .tech-stack {
        text-align: center;
        padding-top: 2rem;
        border-top: 1px solid #e0e0e0;
        color: #777;
    }
    .logos {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-top: 1rem;
        font-weight: 500;
    }
</style>