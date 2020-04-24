function stripArabicDiacritics(word) {
    word = word.replace(/[\u0640\u064b-\u065f]/g, '');
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

module.exports = {
    stripArabicDiacritics: stripArabicDiacritics,
    normalizeArabic: normalizeArabic,
    pushUnique: pushUnique
};