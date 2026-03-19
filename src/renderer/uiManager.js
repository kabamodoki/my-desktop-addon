/**
 * @fileoverview UIコンポーネント管理
 * @description コンポーネントの動的ロード、タブ切り替え、初期化を制御します。
 */
const settingsManager = require('./settings/settings.js');

/**
 * 外部HTMLファイルを読み込み、指定した要素に挿入する
 * @param {string} filePath 読み込むHTMLのパス
 * @param {string} targetId 挿入先の要素ID
 */
async function loadComponent(filePath, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`NotFound: ${filePath}`);
        
        target.innerHTML = await response.text();
        
        // 挿入されたHTML内のscriptタグを再生成して実行させる
        const scripts = target.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
    } catch (err) {
        console.error(`[Load Error] ${filePath}:`, err);
        target.innerHTML = `<p style="color: #ff0000; padding: 10px;">${err.message}</p>`;
    }
}

/**
 * 全コンポーネントの読み込みと初期化
 */
async function initUI() {
    // 1. 各セクションのメイン構造をロード
    await loadComponent('./display/display.html', 'display-section');
    await loadComponent('./settings/settings.html', 'settings-section');
    
    // 2. アドオン要素をそれぞれのコンテナにロード
    await loadComponent('./addons/cpu/cpu.display.html', 'cpu-display-container');
    await loadComponent('./addons/cpu/cpu.settings.html', 'cpu-settings-container');
    await loadComponent('./addons/opacity/opacity.settings.html', 'opacity-settings-container');
    
    // 3. イベント登録と設定マネージャーの起動
    bindEvents();
    settingsManager.initialize();

    // 4. 初期表示としてMONITORタブを活性化
    switchTab('display');
}

/**
 * タブ切り替えと閉じるボタンのイベント紐付け
 */
function bindEvents() {
    const btnDisplay = document.getElementById('btn-display');
    const btnSettings = document.getElementById('btn-settings');
    const btnClose = document.getElementById('btn-close');

    if (btnDisplay) btnDisplay.addEventListener('click', () => switchTab('display'));
    if (btnSettings) btnSettings.addEventListener('click', () => switchTab('settings'));
    if (btnClose) btnClose.addEventListener('click', () => window.close());
}

/**
 * 指定したタブの表示・非表示を切り替える
 * @param {string} tabId 'display' | 'settings'
 */
function switchTab(tabId) {
    // 全てのコンテンツエリアとボタンから活性化クラスを除去
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // 対象のコンテンツを表示し、ボタンをハイライト
    const targetContent = document.getElementById(`${tabId}-section`);
    const targetBtn = document.getElementById(`btn-${tabId}`);

    if (targetContent) targetContent.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// 起動時に初期化を実行
window.addEventListener('DOMContentLoaded', initUI);