/**
 * @fileoverview メインプロセス
 * @description アプリケーションのライフサイクルとウィンドウ生成を管理します。
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const ipcService = require('./services/ipcService');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 350,
        height: 450,
        resizable: false,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    
    // IPC通信の有効化
    ipcService.initialize();
}

// アプリの準備完了後にウィンドウを作成
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});