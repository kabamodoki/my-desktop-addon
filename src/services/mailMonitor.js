const Imap = require('imap');
const { simpleParser } = require('mailparser');

class MailMonitor {
    constructor() {
        this.imap = null;
    }

    // 監視開始
    start(config, onNewMail) {
        // すでに動いていたら一度止める
        this.stop();

        if (!config.email || !config.password) {
            console.log("Mail config missing.");
            return;
        }

        this.imap = new Imap({
            user: config.email,
            password: config.password,
            host: 'imap.gmail.com', // Gmail以外ならここを調整
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        this.imap.once('ready', () => {
            this.imap.openBox('INBOX', true, (err, box) => {
                if (err) return console.error(err);
                console.log('Mail monitoring started...');

                // 新着メールイベントの待機
                this.imap.on('mail', (numNewMsgs) => {
                    this.fetchLatestMail(onNewMail);
                });
            });
        });

        this.imap.once('error', (err) => {
            console.error('IMAP Error:', err);
        });

        this.imap.connect();
    }

    // 最新の1通を取得して解析
    fetchLatestMail(callback) {
        this.imap.search(['UNSEEN'], (err, results) => {
            if (err || !results.length) return;

            const f = this.imap.fetch(results[results.length - 1], { bodies: '' });
            f.on('message', (msg) => {
                msg.on('body', (stream) => {
                    simpleParser(stream, (err, parsed) => {
                        if (parsed) {
                            callback(parsed.subject); // 件名を返す
                        }
                    });
                });
            });
        });
    }

    // 停止
    stop() {
        if (this.imap) {
            this.imap.end();
            this.imap = null;
        }
    }
}

module.exports = new MailMonitor();