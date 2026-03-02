const si = require('systeminformation');

class SystemMonitor {
    /**
     * 現在のCPU使用率とメモリ使用率をまとめて取得
     * @returns {Promise<{cpu: number, mem: number}>}
     */
    async getStats() {
        try {
            // CPU負荷の取得
            const load = await si.currentLoad();

            // メモリ情報の取得
            const mem = await si.mem();

            return {
                // 小数点第1位まで丸める
                cpu: Math.round(load.currentLoad * 10) / 10,
                // (使用中のメモリ / 全メモリ) * 100
                mem: Math.round((mem.active / mem.total) * 100 * 10) / 10
            };
        } catch (error) {
            console.error("System monitor error:", error);
            return { cpu: 0, mem: 0 };
        }
    }
}

// インスタンスをエクスポート
module.exports = new SystemMonitor();