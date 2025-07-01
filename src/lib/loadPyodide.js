export async function loadPyodideInstance() {
    if (window.pyodide) {
        return window.pyodide;
    }
    
    const pyodideScript = document.createElement("script");
    pyodideScript.src = "https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.js";
    pyodideScript.async = true;

    document.head.appendChild(pyodideScript);

    await new Promise((resolve) => {
        pyodideScript.onload = resolve;
    });

    window.pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.3/full/",
    });

    console.log("Pyodide loaded successfully!");
    return window.pyodide;
}