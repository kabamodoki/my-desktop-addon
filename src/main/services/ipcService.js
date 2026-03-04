/**
 * @fileoverview IPC通信サービス
 * @description レンダラープロセスからのリクエストを受け取り、ロジック層の結果を返却します。
 */
const { ipcMain } = require('electron');
const cpuLogic = require('../../renderer/addons/cpu/cpu.logic');

function initialize() {
    ipcMain.handle('get-cpu-usage', async () => {
        try {
            return await cpuLogic.getUsage();
        } catch (err) {
            console.error('CPU情報の取得に失敗しました:', err);
            return 0;
        }
    });
}

module.exports = { initialize };