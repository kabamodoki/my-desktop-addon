const fs = require('fs');
const path = require('path');

// プロジェクトのルートにある config.json を指す
const configPath = path.join(__dirname, '../../config.json');

module.exports = {
    load() {
        if (fs.existsSync(configPath)) {
            try {
                const data = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(data);
            } catch (e) {
                console.error("Config parse error:", e);
            }
        }
        // デフォルト値
        return { cpu: true, mem: true, email: '', password: '' };
    },

    save(config) {
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return true;
        } catch (e) {
            console.error("Config save error:", e);
            return false;
        }
    }
};