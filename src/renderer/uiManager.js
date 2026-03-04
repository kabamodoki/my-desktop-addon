/**
 * @fileoverview UIコンポーネント管理
 * @description 画面の初期化、外部リソースの読み込み、および設定機能の呼び出しを行います。
 */
const settingsManager = require('./settings/settings.js');

async function loadComponent(filePath, targetId) {
    const target = document.getElementById(targetId);
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`NotFound: ${filePath}`);
        
        target.innerHTML = await response.text();
        
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
        console.error(err);
        target.innerHTML = `<p style="color: #ff0000; padding: 10px;">${err.message}</p>`;
    }
}

async function initUI() {
    await loadComponent('./display/display.html', 'display-section');
    await loadComponent('./settings/settings.html', 'settings-section');
    
    await loadComponent('./addons/cpu/cpu.display.html', 'cpu-display-container');
    await loadComponent('./addons/cpu/cpu.settings.html', 'cpu-settings-container');
    
    bindEvents();
    settingsManager.initialize();
}

function bindEvents() {
    document.getElementById('btn-display').addEventListener('click', () => switchTab('display'));
    document.getElementById('btn-settings').addEventListener('click', () => switchTab('settings'));
    document.getElementById('btn-close').addEventListener('click', () => window.close());
}

function switchTab(type) {
    document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    document.getElementById(`${type}-section`).classList.add('active');
}

window.addEventListener('DOMContentLoaded', initUI);