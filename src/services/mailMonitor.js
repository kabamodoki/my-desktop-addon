/**
 * @fileoverview メール監視サービス・モジュール
 * @description IMAPプロトコルを用いてメールサーバーを監視し、新着メールを検知する。
 * 接続維持、エラーハンドリング、およびストリーム解析を制御。
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');

class MailMonitor {
    constructor() {
        /** @type {Imap | null} IMAPクライアントインスタンス */
        this.imap = null;
        /** @type {boolean} 監視実行フラグ */
        this.isActive = false;
    }

    /**
     * メール監視を開始する
     * @param {Object} config 接続設定（email, password）
     * @param {Function} onNewMail 新着メール検知時のコールバック関数 (subject: string) => void
     */
    start(config, onNewMail) {
        // 既存接続のクリーンアップ
        this.stop();

        // バリデーション：必須情報の欠如チェック
        if (!config || !config.email || !config.password) {
            console.warn('[MailMonitor] 設定情報が不十分なため、監視を開始できません。');
            return;
        }

        this.isActive = true;

        /**
         * IMAPクライアントの構成
         * セキュリティ要件に基づき TLS接続を基本とする
         */
        this.imap = new Imap({
            user: config.email,
            password: config.password,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false } // 自己署名証明書等を許容する運用設定
        });

        // 接続完了（Ready）イベントハンドラ
        this.imap.once('ready', () => {
            this._openInbox(onNewMail);
        });

        // エラーハンドリング：接続断や認証失敗を捕捉
        this.imap.once('error', (err) => {
            console.error('[MailMonitor] 通信エラーが発生しました。', err);
            this.isActive = false;
            // 業務要件に応じて、ここで再試行（Retry）ロジックを検討
        });

        // 接続終了イベントハンドラ
        this.imap.once('end', () => {
            console.info('[MailMonitor] IMAP接続が終了しました。');
            this.isActive = false;
        });

        this.imap.connect();
    }

    /**
         * インボックスのオープンとイベント待機
         * @private
         */
    _openInbox(callback) {
        if (!this.imap) return;

        this.imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('[MailMonitor] インボックスの展開に失敗しました。', err);
                return;
            }
            console.info('[MailMonitor] メール監視（IDLE開始）に成功しました。');

            // --- ★修正：接続した瞬間に、現在の未読メールを一度取得する ---
            this._fetchUnseenMails(callback);
            // --------------------------------------------------------

            // 新着メールイベントのリスナー登録（これはそのまま）
            this.imap.on('mail', (numNewMsgs) => {
                console.info(`[MailMonitor] サーバーから新着通知を受信しました: ${numNewMsgs}件`);
                this._fetchUnseenMails(callback);
            });
        });
    }

    /**
         * 未読メールを検索し、最新の最大5通を取得・解析する
         * @private
         */
    _fetchUnseenMails(callback) {
        if (!this.imap) return;

        this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
                console.error('[MailMonitor] メール検索中にエラーが発生しました。', err);
                return;
            }

            if (!results || results.length === 0) {
                callback([]); // 未読ゼロなら空配列を返す
                return;
            }

            // ★修正：最新の5件に絞る（件数が5件未満なら全件）
            const targetIds = results.slice(-5).reverse();
            const fetchStream = this.imap.fetch(targetIds, { bodies: '' });

            const mailList = [];
            let processedCount = 0;

            fetchStream.on('message', (msg) => {
                msg.on('body', (stream) => {
                    simpleParser(stream, (err, parsed) => {
                        processedCount++;

                        if (!err && parsed) {
                            mailList.push({
                                subject: parsed.subject || '(No Subject)',
                                date: parsed.date || new Date()
                            });
                        }

                        // ★指定した全件の解析が終わったらUIに送る
                        if (processedCount === targetIds.length) {
                            // 日付順にソート（念のため）
                            mailList.sort((a, b) => b.date - a.date);
                            callback(mailList);
                        }
                    });
                });
            });

            fetchStream.on('error', (err) => {
                console.error('[MailMonitor] フェッチエラー:', err);
            });
        });
    }

    /**
     * 監視を停止し、リソースを解放する
     */
    stop() {
        if (this.imap) {
            console.info('[MailMonitor] 接続を終了しています...');
            this.imap.end();
            this.imap = null;
        }
        this.isActive = false;
    }
}

// シングルトンインスタンスとしてエクスポート
module.exports = new MailMonitor();