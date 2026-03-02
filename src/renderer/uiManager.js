const { ipcRenderer } = require('electron');
const systemMonitor = require('../services/systemMonitor');

function resizeToFit() {
    // DOMの更新が終わるのをわずかに待ってから計測
    requestAnimationFrame(() => {
        const body = document.body;
        // border分を含めた高さを取得
        const height = body.getBoundingClientRect().height;
        const width = body.getBoundingClientRect().width;
        ipcRenderer.send('resize-window', {
            width: Math.ceil(width),
            height: Math.ceil(height)
        });
    });
}

window.showTab = (tabName) => {
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(tabName).style.display = 'block';
    document.getElementById('btn-' + tabName).classList.add('active');

    resizeToFit();
};

window.saveConfig = () => {
    const config = {
        cpu: document.getElementById('cpu-check').checked,
        mem: document.getElementById('mem-check').checked,
        email: document.getElementById('email-input').value,
        password: document.getElementById('pass-input').value
    };
    ipcRenderer.send('save-config', config);
    applyVisibility(config);
};

function applyVisibility(config) {
    document.getElementById('cpu-sec').style.display = config.cpu ? 'block' : 'none';
    document.getElementById('mem-sec').style.display = config.mem ? 'block' : 'none';
    resizeToFit(); // 項目が消えた時もサイズ調整
}

window.closeApp = () => ipcRenderer.send('close-app');

ipcRenderer.on('init-config', (event, config) => {
    document.getElementById('cpu-check').checked = config.cpu;
    document.getElementById('mem-check').checked = config.mem;
    document.getElementById('email-input').value = config.email || '';
    document.getElementById('pass-input').value = config.password || '';

    // 初期表示の反映
    document.getElementById('cpu-sec').style.display = config.cpu ? 'block' : 'none';
    document.getElementById('mem-sec').style.display = config.mem ? 'block' : 'none';
    resizeToFit();
});

ipcRenderer.send('request-config');

async function updateTick() {
    const stats = await systemMonitor.getStats();
    document.getElementById('cpu-val').innerText = `${stats.cpu}%`;
    document.getElementById('cpu-bar').style.width = `${stats.cpu}%`;
    document.getElementById('mem-val').innerText = `${stats.mem}%`;
    document.getElementById('mem-bar').style.width = `${stats.mem}%`;
}

setInterval(updateTick, 1000);
updateTick();