/**
 * @fileoverview IPCハンドリング・マネジメントモジュール
 */

const { ipcMain, app } = require('electron');
const configManager = require('./configManager');
const mailMonitor = require('../services/mailMonitor'); // 追加：メール監視サービスを読み込む

module.exports = {
    register(mainWindow) {

        // [初期化要求] 設定情報ロード
        ipcMain.on('request-config', (event) => {
            const config = configManager.load();
            event.reply('init-config', config);
            
            // 重要：アプリ起動時にも、設定があれば自動でメール監視を開始する
            if (config && config.email && config.password) {
                this.startMailMonitoring(mainWindow, config);
            }
        });

        // [更新要求] 設定情報の保存
        ipcMain.on('save-config', (event, newConfig) => {
            if (!newConfig || typeof newConfig !== 'object') return;

            try {
                const isSuccess = configManager.save(newConfig);

                if (isSuccess) {
                    console.info('[IPCHandler] 設定の保存成功。メール監視を再起動します。');
                    
                    // 重要：保存した瞬間に新しい設定でメール監視を開始（または再起動）
                    this.startMailMonitoring(mainWindow, newConfig);
                }
            } catch (error) {
                console.error('[IPCHandler] 設定保存エラー:', error);
            }
        });

        // [システム要求] アプリケーションの正常終了
        ipcMain.on('close-app', () => {
            mailMonitor.stop(); // 終了前に接続を安全に切断
            app.quit();
        });
    },

    /**
     * メール監視を開始し、結果をレンダラーへ橋渡しする
     */
    startMailMonitoring(mainWindow, config) {
        mailMonitor.start(config, (mails) => {
            // MailMonitorから受け取った「最新5件リスト」をそのまま画面へ転送
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-mail-list', mails);
            }
        });
    }
};