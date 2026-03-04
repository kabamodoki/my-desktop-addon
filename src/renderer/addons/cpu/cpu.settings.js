/**
 * @fileoverview CPU設定管理
 * @description ユーザーのモニタリング設定状態をローカルストレージへ保存・復元します。
 */
(function() {
    const check = document.getElementById('cpu-active-check');
    if (!check) return;

    const STORAGE_KEY = 'cpu-monitor-active';

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState !== null) {
        check.checked = savedState === 'true';
    } else {
        check.checked = true;
    }

    check.addEventListener('change', (e) => {
        localStorage.setItem(STORAGE_KEY, e.target.checked);
    });
})();