const { ipcMain, app } = require('electron');
const configManager = require('./configManager');

module.exports = {
    register(mainWindow) {
        // 設定のリクエストに対して現在の設定を返す
        ipcMain.on('request-config', (event) => {
            const config = configManager.load();
            event.reply('init-config', config);
        });

        // 設定の保存命令
        ipcMain.on('save-config', (event, newConfig) => {
            configManager.save(newConfig);
            // メーター表示の更新が必要な場合はここで通知を送ることも可能
            console.log("Config saved:", newConfig);
        });

        // アプリを閉じる
        ipcMain.on('close-app', () => {
            app.quit();
        });
    }
};