const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ipcHandlers = require('./ipcHandlers');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 150, // 初期サイズ
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        // これが有効だとドラッグできない場合があるため、一旦デフォルトのままでOK
        // hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // マウスイベントを無視する設定が入っていたら削除してください
    // mainWindow.setIgnoreMouseEvents(false);

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    ipcHandlers.register(mainWindow);

    // コンテンツの大きさに合わせてウィンドウサイズを自動調整する命令
    ipcMain.on('resize-window', (event, { width, height }) => {
        if (mainWindow) mainWindow.setSize(width, height);
    });
}

app.whenReady().then(createWindow);