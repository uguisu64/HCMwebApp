# HCMWebApp

このリポジトリは、クラスタリングに関する授業で作成されたWebアプリケーションです。SvelteKitとPyodide、WebAssembly (Wasm) を利用して、ブラウザ上でクラスタリングアルゴリズム（特にHCM: Hard C-Means）を実行し、その結果を可視化します。

## 機能

-   **クラスタリングアルゴリズムの実行**: ブラウザ上でPythonのクラスタリングアルゴリズム（HCMなど）を実行します。
-   **結果の可視化**: クラスタリング結果をグラフや図で分かりやすく表示します。
-   **インタラクティブな操作**: ユーザーがパラメータを変更し、リアルタイムで結果を確認できます。

## 技術スタック

-   **SvelteKit**: 高速でモダンなWebアプリケーション開発のためのフレームワーク。
-   **Pyodide**: WebAssemblyを通じてブラウザ上でPythonコードを実行するためのプロジェクト。
-   **WebAssembly (Wasm)**: 高性能なクライアントサイドアプリケーションを実現するためのバイナリ命令フォーマット。Pythonのクラスタリングロジックを効率的に実行するために使用されます。
-   **Plotly.js**: インタラクティブなグラフ描画ライブラリ。

## セットアップ

このプロジェクトをローカルで実行するには、以下の手順に従ってください。

1.  **リポジトリのクローン**:
    ```bash
    git clone https://github.com/your-username/HCMWebApp.git
    cd HCMWebApp
    ```
2.  **依存関係のインストール**:
    ```bash
    npm install
    ```
3.  **開発サーバーの起動**:
    ```bash
    npm run dev
    ```
    ブラウザで `http://localhost:5173` (または表示されたポート) にアクセスすると、アプリケーションが表示されます。

## ビルドとデプロイ

プロダクション用にアプリケーションをビルドするには：

```bash
npm run build
```

ビルドされたアプリケーションは `build` ディレクトリに出力されます。静的ホスティングサービスにデプロイする場合は、`@sveltejs/adapter-static` を使用しているため、このディレクトリの内容をアップロードしてください。

## ディレクトリ構造

-   `src/routes/`: SvelteKitのルーティングとページコンポーネントが含まれます。
    -   `+page.svelte`: メインページ。
    -   `classificationFunction/`: クラスタリング機能に関連するページ。
    -   `executeClustering/`: クラスタリング実行に関連するページ。
    -   `fullver/`: 完全版の機能に関連するページ。
-   `src/lib/`: 再利用可能なコンポーネントやユーティリティ関数が含まれます。
    -   `loadPyodide.js`: Pyodideのロードと初期化に関するロジック。
    -   `pythonCodes.js`: ブラウザで実行されるPythonコード。
    -   `wasm/`: WebAssemblyモジュール（`hcm.wasm`, `sfcm.wasm`など）が含まれます。
-   `static/`: 静的アセット（`favicon.png`など）が含まれます。