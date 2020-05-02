"use strict";
const fs = require('fs');
const nodemailer = require('nodemailer');
const HOMEDIR = require('os').homedir();

const SMTP = JSON.parse(fs.readFileSync(HOMEDIR + '/.levantinereader.smtp.json'));
const MAILER = nodemailer.createTransport({
    host: SMTP.host,
    port: SMTP.port,
    secure: SMTP.secure, // true for 465, false for other ports
    auth: {
        user: SMTP.user, // generated ethereal user
        pass: SMTP.pass // generated ethereal password
    }
});

class Notifier {

    static async notifyOnAdd(pos, word, def) {
        let info = await MAILER.sendMail({
            from: '"Levantine Reader" <noreply@levantinereader.com>',
            to: SMTP.user,
            subject: '[Levantine Reader] New Word Added: ' + pos + ', ' + word,
            text: 'POS: ' + pos + '\nWord: [' + word + ']' + '\nDef: ' + def
        });
    }

    static async notifyOnUpdate(id, word, def) {
        let info = await MAILER.sendMail({
            from: '"Levantine Reader" <noreply@levantinereader.com>',
            to: SMTP.user,
            subject: '[Levantine Reader] Word Updated: ' + word,
            text: 'ID: ' + id + '\nWord: [' + word + ']' + '\nDef: ' + def
        });
    }

    static async notifyOnDelete(id, word) {
        let info = await MAILER.sendMail({
            from: '"Levantine Reader" <noreply@levantinereader.com>',
            to: SMTP.user,
            subject: '[Levantine Reader] Word Deleted: ' + word,
            text: 'ID: ' + id + '\nWord: [' + word + ']'
        });
    }

    static async notifyOnError(subject, msg) {
        let info = await MAILER.sendMail({
            from: '"Levantine Reader" <noreply@levantinereader.com>',
            to: SMTP.user,
            subject: '[Levantine Reader] Error: ' + subject,
            text: msg
        });
    }

}

module.exports = Notifier;