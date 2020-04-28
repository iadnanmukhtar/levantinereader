"use strict";

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


module.exports = {
    fixContent: fixContent,
    stripArabicDiacritics: stripArabicDiacritics,
    normalizeArabic: normalizeArabic,
    pushUnique: pushUnique,
    sortBy: sortBy
};