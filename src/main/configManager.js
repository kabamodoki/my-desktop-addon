/**
 * @fileoverview アプリケーション設定ファイルの入出力管理モジュール
 * @description JSON形式の設定ファイル（config.json）の読み込み・書き込み、および初期値制御を行う。
 */

const fs = require('fs');
const path = require('path');

/** * 設定ファイルの保存先パス
 * プロジェクトルート直下の config.json を参照
 */
const CONFIG_FILE_PATH = path.join(__dirname, '../../config.json');

/**
 * 設定値のデフォルト定義
 * 仕様変更による項目追加時はここをマスターとして更新する
 */
const DEFAULT_CONFIG = {
    cpu: true,
    mem: true,
    email: '',
    password: ''
};

module.exports = {
    /**
     * 設定ファイルの読み込みを実行する
     * @returns {Object} 取得した設定オブジェクト、ファイル不在または破損時はデフォルト値を返却
     */
    load() {
        // ファイル存在確認
        if (!fs.existsSync(CONFIG_FILE_PATH)) {
            console.info(`[ConfigManager] 設定ファイル未検出のためデフォルト値を使用します。Path: ${CONFIG_FILE_PATH}`);
            return { ...DEFAULT_CONFIG };
        }

        try {
            const rawData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
            const parsedData = JSON.parse(rawData);

            // 既存データとデフォルト値をマージ（新機能追加時の不整合防止）
            return { ...DEFAULT_CONFIG, ...parsedData };
        } catch (error) {
            console.error(`[ConfigManager] 設定ファイルのパースに失敗しました。ファイルが破損している可能性があります。`, error);
            // 業務継続のため例外をスローせず、デフォルト値を返却してフォールバック
            return { ...DEFAULT_CONFIG };
        }
    },

    /**
     * 設定値をファイルに永続化する
     * @param {Object} config 保存対象の設定オブジェクト
     * @returns {boolean} 保存成否ステータス
     */
    save(config) {
        try {
            // ディレクトリの存在を保証（必要に応じて追加）
            const dir = path.dirname(CONFIG_FILE_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // JSON形式に整形して同期書き込みを実行
            const writeData = JSON.stringify(config, null, 2);
            fs.writeFileSync(CONFIG_FILE_PATH, writeData, 'utf8');

            console.log(`[ConfigManager] 設定情報の保存が完了しました。`);
            return true;
        } catch (error) {
            console.error(`[ConfigManager] 設定ファイルの書き込み中にI/Oエラーが発生しました。`, error);
            return false;
        }
    }
};