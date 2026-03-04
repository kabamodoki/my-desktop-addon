/**
 * @fileoverview CPUデータ取得・描画制御
 * @description メインプロセスから情報を取得し、表示コンテナが可視状態の場合のみ画面を更新します。
 */
(function() {
    const { ipcRenderer } = require('electron');
    const displayContainer = document.getElementById('cpu-display-container');

    async function updateDisplay() {
        if (displayContainer && displayContainer.style.display === 'none') return;

        try {
            const bar = document.getElementById('cpu-progress-bar');
            const text = document.getElementById('cpu-usage-text');

            if (!bar || !text) return;

            const usage = await ipcRenderer.invoke('get-cpu-usage');
            bar.style.width = `${usage}%`;
            text.innerText = `${usage}%`;
        } catch (err) {
            console.error('Data acquisition failed:', err);
        }
    }

    if (!window.cpuMonitorStarted) {
        window.cpuMonitorStarted = true;
        setInterval(updateDisplay, 2000);
        updateDisplay();
    }
})();