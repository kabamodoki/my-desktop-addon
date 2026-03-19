/**
 * @fileoverview 背景透過度制御アドオン
 * @description スライダー値に基づき、メインコンテナのアルファ値を動的に変更します。
 */
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../settings/settings.json');

function initOpacityAddon() {
    const slider = document.getElementById('bg-opacity-slider');
    const label = document.getElementById('bg-opacity-label');
    const container = document.querySelector('.widget-container');

    if (!slider || !container) return;

    // 設定ファイルの読み込み
    let settings = {};
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            settings = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        }
    } catch (e) { console.error("Settings load error:", e); }

    /**
     * 背景色を適用 (rgbaのアルファ値のみ更新)
     * @param {number} val 0-100の数値
     */
    const applyOpacity = (val) => {
        const alpha = val / 100;
        container.style.backgroundColor = `rgba(0, 5, 2, ${alpha})`;
        if (label) label.textContent = `${val}%`;
    };

    // 初期値の適用 (保存値がなければ100)
    const initialVal = settings.opacity !== undefined ? settings.opacity : 100;
    slider.value = initialVal;
    applyOpacity(initialVal);

    // スライダー操作時のイベント
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        applyOpacity(val);
        
        // 設定を保存
        settings.opacity = val;
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf-8');
        } catch (e) { console.error("Settings save error:", e); }
    });
}

// 初期化実行
initOpacityAddon();