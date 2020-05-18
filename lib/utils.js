"use strict";

const DIACRITICS_ALL = /[\u0640\u064b-\u065f]/g;
const DIACRITICS_BASIC = /[\u0640\u064b-\u0650\u0652-\u065f]/g;

function fixContent(content) {
    return content.replace(new RegExp('\\s(' + DIACRITICS_ALL.source + ')', 'g'), '$1');
}

function stripAllArabicDiacritics(word) {
    word = word.replace(DIACRITICS_ALL, '');
    word = word.replace(/[أإآ]/g, 'ا');
    return word;
}

function stripBasicArabicDiacritics(word) {
    word = word.replace(DIACRITICS_BASIC, '');
    return word;
}

function normalizeArabic(text) {
    return text.replace(/ث/g, 'ت').replace(/ز/g, 'ذ').replace(/ض/g, 'ظ')
        .replace(/[ؤئ]/g, 'ء').replace(/ڥ/g, 'ق').replace(/ڤ/g, 'ف');
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

function pushUniqueObject(arr, key, value, obj) {
    var found = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][key] == value) {
            found = true;
            break;
        }
    }
    if (!found)
        arr.push(obj);
    return arr;
}

function hashCode(s) {
    var hash = 0,
        i, chr;
    for (i = 0; i < s.length; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function cloneObject(a) {
    return JSON.parse(JSON.stringify(a));
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


module.exports = {
    fixContent: fixContent,
    stripAllArabicDiacritics: stripAllArabicDiacritics,
    stripBasicArabicDiacritics: stripBasicArabicDiacritics,
    normalizeArabic: normalizeArabic,
    pushUnique: pushUnique,
    pushUniqueObject: pushUniqueObject,
    hashCode: hashCode,
    cloneObject: cloneObject,
    sortBy: sortBy
};