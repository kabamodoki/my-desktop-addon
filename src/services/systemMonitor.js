/**
 * @fileoverview システムリソース監視サービス（軽量・低負荷版）
 * @description 外部ライブラリやOSコマンドのオーバーヘッドを排除し、
 * Node.js標準機能のみでパフォーマンスへの影響を最小限に抑えた実装。
 */

const os = require('os');

class SystemMonitor {
    constructor() {
        // 初回計算用のバッファ
        this.lastCpus = this._getRawCpuStats();
    }

    /**
     * システム統計情報の取得
     * @returns {Promise<{cpu: number, mem: number}>}
     */
    async getStats() {
        try {
            // CPU負荷の簡易計算（前回との差分から算出）
            const currentCpus = this._getRawCpuStats();
            const idleDiff = currentCpus.idle - this.lastCpus.idle;
            const totalDiff = currentCpus.total - this.lastCpus.total;
            
            const cpuUsage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;
            this.lastCpus = currentCpus;

            // メモリ負荷の取得（計算負荷をかけない直接取得）
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memUsage = ((totalMem - freeMem) / totalMem) * 100;

            return {
                cpu: this._format(cpuUsage),
                mem: this._format(memUsage)
            };
        } catch (error) {
            // 例外発生時はシステムへの影響を避けるため最小限のレスポンスを返却
            return { cpu: 0, mem: 0 };
        }
    }

    /**
     * CPUの生データを取得（計算用）
     * @private
     */
    _getRawCpuStats() {
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;

        for (let i = 0; i < cpus.length; i++) {
            const times = cpus[i].times;
            for (const type in times) {
                total += times[type];
            }
            idle += times.idle;
        }

        return { idle, total };
    }

    /**
     * 数値整形（処理の速い四捨五入を採用）
     * @private
     */
    _format(value) {
        return Math.round(value * 10) / 10;
    }
}

module.exports = new SystemMonitor();