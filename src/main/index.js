/**
 * @fileoverview メインプロセス・エントリーポイント
 * @description アプリケーションのライフサイクル管理、メインウィンドウの生成、およびIPC通信のハブ機能を担う。
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ipcHandlers = require('./ipcHandlers');

/**
 * メインウィンドウのインスタンス管理用変数
 * @type {BrowserWindow | null}
 */
let mainWindow = null;

/**
 * メインウィンドウの初期化および生成処理
 */
function createWindow() {
    // ウィンドウオプションの定義：デスクトップウィジェットに特化した構成
    mainWindow = new BrowserWindow({
        width: 300,
        height: 150,           // 初期サイズ設定
        useContentSize: true,  // フレームを含まないコンテンツサイズを基準にする
        frame: false,          // ネイティブウィンドウ枠を非表示
        transparent: true,     // 背景透過を有効化
        resizable: false,      // ユーザーによる自由なリサイズを禁止
        alwaysOnTop: true,     // 常に最前面に表示
        hasShadow: false,      // 透過時の描画不具合防止のためOS標準の影を無効化
        webPreferences: {
            nodeIntegration: true,    // レンダラーでのNode.js利用を許可
            contextIsolation: false,  // シンプルなIPC通信のため隔離を無効化
        }
    });

    // レンダラープロセスのHTML資産をロード
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    mainWindow.loadFile(htmlPath);

    // 外部ハンドラーの登録（既存のロジック）
    ipcHandlers.register(mainWindow);

    // --- IPC（Inter-Process Communication）ハンドラーの定義 ---

    /**
     * ウィンドウリサイズ要求の購読
     * @param {Object} payload - { width, height }
     */
    ipcMain.on('resize-window', (event, { width, height }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setSize(width, height, true);
        }
    });

    /**
     * ウィンドウ透過度の設定
     * @param {number} opacityValue - 0.0（透明）から1.0（不透明）
     */
    ipcMain.on('set-opacity', (event, opacityValue) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const opacity = parseFloat(opacityValue);
            // 数値が有効な範囲(0.0 - 1.0)であることを保証して適用
            if (!isNaN(opacity)) {
                mainWindow.setOpacity(Math.min(Math.max(opacity, 0.0), 1.0));
            }
        }
    });

    // ウィンドウ破棄時のリソース解放
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * アプリケーション初期化完了時のイベントハンドラ
 */
app.whenReady().then(() => {
    createWindow();

    // macOS等でのアクティベート時の再生成処理
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

/**
 * 全ウィンドウ閉鎖時のイベントハンドラ
 */
app.on('window-all-closed', () => {
    // macOS（darwin）以外のプラットフォームではプロセスを終了
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * セキュリティ上の懸念を最小化するため、不要なナビゲーションを防止
 */
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event) => {
        event.preventDefault();
    });
});