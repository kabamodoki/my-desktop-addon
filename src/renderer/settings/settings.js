/**
 * @fileoverview 設定情報管理
 * @description アドオンの稼働状態を物理ファイルとして永続化し、画面表示を統制します。
 */
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'settings.json');

function readSettings() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error(e);
    }
    return {};
}

function writeSettings(data) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(data), 'utf-8');
    } catch (e) {
        console.error(e);
    }
}

function initialize() {
    const settings = readSettings();
    const toggles = document.querySelectorAll('.addon-toggle');
    
    toggles.forEach(toggle => {
        const addonId = toggle.dataset.addonId;
        const container = document.getElementById(`${addonId}-display-container`);
        
        const isEnabled = settings[addonId] !== false;
        toggle.checked = isEnabled;
        
        if (container) {
            container.style.display = isEnabled ? 'block' : 'none';
        }

        toggle.addEventListener('change', (e) => {
            settings[addonId] = e.target.checked;
            writeSettings(settings);
            
            if (container) {
                container.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    });
}

module.exports = { initialize };