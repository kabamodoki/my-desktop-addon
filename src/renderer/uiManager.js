/**
 * @fileoverview UIマネジメント・レンダラーロジック
 * @description DOM操作、イベントハンドリング、メインプロセスとのIPC通信、
 * およびシステム情報の定期モニタリングを制御する。
 */

const { ipcRenderer } = require('electron');
// 注意: systemMonitorはプロジェクトのフォルダ構造に合わせてパスを確認してください
const systemMonitor = require('../services/systemMonitor');

/**
 * DOM要素キャッシュ
 */
const elements = {
    body: document.body,
    contents: document.querySelectorAll('.content'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    cpuSec: document.getElementById('cpu-sec'),
    memSec: document.getElementById('mem-sec'),
    cpuVal: document.getElementById('cpu-val'),
    cpuBar: document.getElementById('cpu-bar'),
    memVal: document.getElementById('mem-val'),
    memBar: document.getElementById('mem-bar'),
    // 設定関連
    opacityRange: document.getElementById('opacity-range'),
    opacityVal: document.getElementById('opacity-val'),
    cpuCheck: document.getElementById('cpu-check'),
    memCheck: document.getElementById('mem-check'),
    emailInput: document.getElementById('email-input'),
    passInput: document.getElementById('pass-input'),
    saveBtn: document.getElementById('save-config'),
    closeBtn: document.getElementById('close-app'),
    mailContainer: document.getElementById('mail-list-container')
};

/**
 * ウィンドウサイズをコンテンツに合わせる
 */
const resizeToFit = () => {
    requestAnimationFrame(() => {
        const rect = elements.body.getBoundingClientRect();
        ipcRenderer.send('resize-window', {
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height)
        });
    });
};

/**
 * タブ切り替え処理
 * @param {string} targetId 表示するコンテンツのID
 */
const switchTab = (targetId) => {
    elements.contents.forEach(content => {
        const isActive = content.id === targetId;
        content.style.display = isActive ? 'block' : 'none';
        content.classList.toggle('active', isActive);
        content.setAttribute('aria-hidden', !isActive);
    });

    elements.tabBtns.forEach(btn => {
        const isActive = btn.getAttribute('aria-controls') === targetId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    // 表示切り替え後にサイズ調整
    setTimeout(resizeToFit, 20);
};

/**
 * 設定の保存と反映
 */
const handleSaveConfig = () => {
    const config = {
        cpu: elements.cpuCheck.checked,
        mem: elements.memCheck.checked,
        email: elements.emailInput.value,
        password: elements.passInput.value
    };

    console.info('[UIManager] 設定を保存します。');
    ipcRenderer.send('save-config', config);

    // UIの表示/非表示を即時反映
    elements.cpuSec.style.display = config.cpu ? 'block' : 'none';
    elements.memSec.style.display = config.mem ? 'block' : 'none';
    resizeToFit();
};

/**
 * システム情報の更新
 */
const updateTick = async () => {
    try {
        const stats = await systemMonitor.getStats();

        // CPU
        elements.cpuVal.innerText = `${stats.cpu}%`;
        elements.cpuBar.style.width = `${stats.cpu}%`;

        // RAM
        elements.memVal.innerText = `${stats.mem}%`;
        elements.memBar.style.width = `${stats.mem}%`;
    } catch (error) {
        console.error('[UIManager] モニタリング更新失敗:', error);
    }
};

/**
 * メールリストの描画
 */
const renderMailList = (mails) => {
    if (!elements.mailContainer) return;
    elements.mailContainer.innerHTML = '';

    if (!mails || mails.length === 0) {
        elements.mailContainer.innerHTML = '<div class="mail-row" style="opacity:0.5; font-size:9px;">No new messages</div>';
        return;
    }

    const mailList = Array.isArray(mails) ? mails : [mails];

    mailList.forEach(mail => {
        const row = document.createElement('div');
        row.className = 'mail-row';
        const timeStr = new Date(mail.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <span class="mail-time">${timeStr}</span>
            <div class="mail-scroll-box">
                <span class="mail-subject-text">${mail.subject}</span>
            </div>
        `;
        elements.mailContainer.appendChild(row);

        // テキスト溢れチェック（レンダリング後に判定）
        const scrollBox = row.querySelector('.mail-scroll-box');
        const textSpan = row.querySelector('.mail-subject-text');
        if (textSpan.offsetWidth > scrollBox.offsetWidth) {
            textSpan.classList.add('mail-subject-scroll');
        }
    });

    resizeToFit();
};

/**
 * イベントリスナーの初期化
 */
const initEventListeners = () => {
    // タブ切り替え
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('aria-controls')));
    });

    // 透過度スライダー
    elements.opacityRange.addEventListener('input', (e) => {
        const val = e.target.value; // 0.1 ~ 1.0
        elements.opacityVal.innerText = `${Math.round(val * 100)}%`;

        // ウィンドウ全体の透過（ipcRenderer.send('set-opacity', val)）を停止し、
        // ルート要素のCSS変数を書き換える
        document.documentElement.style.setProperty('--bg-opacity', val);
    });

    // 保存・終了ボタン
    elements.saveBtn.addEventListener('click', handleSaveConfig);
    elements.closeBtn.addEventListener('click', () => ipcRenderer.send('close-app'));
};

/**
 * アプリ初期化
 */
const init = () => {
    initEventListeners();
    ipcRenderer.send('request-config');

    // モニタリング開始
    setInterval(updateTick, 500);
    updateTick();
};

// メインプロセスからの通信受信
ipcRenderer.on('init-config', (event, config) => {
    if (!config) return;
    elements.cpuCheck.checked = !!config.cpu;
    elements.memCheck.checked = !!config.mem;
    elements.emailInput.value = config.email || '';
    elements.passInput.value = config.password || '';

    // 表示状態の初期反映
    elements.cpuSec.style.display = config.cpu ? 'block' : 'none';
    elements.memSec.style.display = config.mem ? 'block' : 'none';
    setTimeout(resizeToFit, 100);
});

ipcRenderer.on('update-mail-list', (event, mails) => renderMailList(mails));

// 実行開始
init();