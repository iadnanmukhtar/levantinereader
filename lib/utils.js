"use strict";
const fs = require('fs');
const nodemailer = require('nodemailer');

const HOMEDIR = require('os').homedir();
const DIACRITICS = /[\u0640\u064b-\u065f]/g;

function fixContent(content) {
    return content.replace(new RegExp('\\s(' + DIACRITICS.source + ')', 'g'), '$1');
}

function stripArabicDiacritics(word) {
    word = word.replace(DIACRITICS, '');
    word = word.replace(/[أإآ]/g, 'ا');
    return word;
}

function normalizeArabic(text) {
    return text.replace(/ث/, 'ت').replace(/ز/, 'ذ').replace(/ض/, 'ظ').replace(/س/, 'ص');
}

function pushUnique(arr, value) {
    var found = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == value) {
            found = true;
            break;
        }
    }
    if (!found)
        arr.push(value);
    return arr;
}

var sortBy = function () {
    var fields = [].slice.call(arguments),
        n_fields = fields.length;

    return function (A, B) {
        var a, b, field, key, primer, reverse, result, i;

        for (i = 0; i < n_fields; i++) {
            result = 0;
            field = fields[i];

            key = typeof field === 'string' ? field : field.name;

            a = A[key];
            b = B[key];

            if (typeof field.primer !== 'undefined') {
                a = field.primer(a);
                b = field.primer(b);
            }

            reverse = (field.reverse) ? -1 : 1;

            if (a < b) result = reverse * -1;
            if (a > b) result = reverse * 1;
            if (result !== 0) break;
        }
        return result;
    }
};

const SMTP = JSON.parse(fs.readFileSync(HOMEDIR + '/.smtp'));
const MAILER = nodemailer.createTransport({
    host: SMTP.host,
    port: SMTP.port,
    secure: SMTP.secure, // true for 465, false for other ports
    auth: {
        user: SMTP.user, // generated ethereal user
        pass: SMTP.pass // generated ethereal password
    }
});

async function notifyOnNewWord(pos, word, def) {
    let info = await MAILER.sendMail({
        from: '"Levantine Reader" <noreply@levantinereader.com>',
        to: SMTP.user,
        subject: '[Levantine Reader] New Word Added: ' + pos + ', ' + word,
        text: 'POS: ' + pos + '\nWord: [' + word + ']' + '\nDef: ' + def
    });
}

async function notifyOnError(subject, msg) {
    let info = await MAILER.sendMail({
        from: '"Levantine Reader" <noreply@levantinereader.com>',
        to: SMTP.user,
        subject: '[Levantine Reader] Error: ' + subject,
        text: msg
    });
}


module.exports = {
    fixContent: fixContent,
    stripArabicDiacritics: stripArabicDiacritics,
    normalizeArabic: normalizeArabic,
    pushUnique: pushUnique,
    sortBy: sortBy,
    notifyOnNewWord: notifyOnNewWord,
    notifyOnError: notifyOnError
};