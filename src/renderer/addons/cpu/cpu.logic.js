/**
 * @fileoverview CPUモニタリングロジック
 * @description システム全体の現在のCPU負荷率を取得します。
 */
const si = require('systeminformation');

async function getUsage() {
    try {
        const load = await si.currentLoad();
        return Math.round(load.currentLoad);
    } catch (error) {
        console.error('CPU使用率の取得に失敗しました', error);
        return 0;
    }
}

module.exports = { getUsage };