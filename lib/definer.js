const fs = require('fs');
const csv = require('csv-parse/lib/sync');
const bwconverter = require('../lib/buckwalter-converter-node');

const STOPS = csv(fs.readFileSync(__dirname + "/../assets/levantine.arabic.stop.tsv"), {
    columns: true,
    delimiter: '\t',
    quote: false
});
stripDiacriticsFromList(STOPS, 'term', 'term_b');

const WORDS = csv(fs.readFileSync(__dirname + "/../assets/levantine.arabic.words.tsv"), {
    columns: true,
    delimiter: '\t',
    quote: false
});
stripDiacriticsFromList(WORDS, 'term', 'term_b');

const VERBS = csv(fs.readFileSync(__dirname + "/../assets/levantine.arabic.verbs.tsv"), {
    columns: true,
    delimiter: '\t',
    quote: false
});
stripDiacriticsFromList(VERBS, 'past', 'past_b');
stripDiacriticsFromList(VERBS, 'pres', 'pres_b');


const PREFIXES = /[ك ل ا و س ب ي ن م ت ف ع]/;
const SUFFIXES = /[م ن ك ه ة ت ا ي و]/;

var define = function (word) {
    var match = true;
    var stems = getStems(stripDiacritics(word));
    if (stems.length == 0) {
        match = false;
        stems = null;
    }
    var exactMatch = false;
    for (var i = 0; stems && i < stems.length; i++) {
        exactMatch = stems[i].exactMatch
        if (exactMatch)
            break;
    }
    return {
        word: word,
        match: match,
        exactMatch: exactMatch,
        stems: stems
    };
}

module.exports = {
    define: define
}

function getStems(word) {
    var stems = new Array();

    var stemCandidates = new Array();
    // find matches in dictionary
    // lookup stop words and stop processing additional search
    var candidates = findStemCandidates(STOPS, 'stop word', 'term_b', [word], true);
    if (candidates.length > 0)
        return stemCandidates.concat(candidates);
    else {
        var frags = new Array();
        trimPrefixes(frags, word);
        trimSuffixes(frags, word);

        // lookup present tense
        var fragsPres = new Array().concat(frags);
        for (var i = 0; i < fragsPres.length; i++) {
            if (fragsPres[i].length >= 4)
                fragsPres[i] = fragsPres[i].replace(/^(بت|بي|بن|من)/, //
                    'ي');
            else if (fragsPres[i].length >= 3)
                fragsPres[i] = fragsPres[i].replace(/^(ت|ي|ن|ب|ا)/, //
                    'ي');
        }
        candidates = findStemCandidates(VERBS, 'present tense', 'pres_b', fragsPres);
        if (candidates.length > 0)
            stemCandidates = stemCandidates.concat(candidates);
        // lookup past tense
        var fragsPast = new Array().concat(frags);
        for (var i = 0; i < fragsPast.length; i++) {
            if (fragsPast[i].length >= 4) {
                pushUniqueValue(fragsPast, fragsPast[i].replace(/ي$/, //
                    'ى'));
                pushUniqueValue(fragsPast, fragsPast[i].replace(/(ت|و|وا|تي|تو|تم|نا)$/, //
                    ''));
                pushUniqueValue(fragsPast, fragsPast[i].replace(/(ي|يت|و|وا|يتي|يتم|يتو|ينا)$/, //
                    'ى'));
            }
        }
        candidates = findStemCandidates(VERBS, 'past tense', 'past_b', fragsPast);
        if (candidates.length > 0)
            stemCandidates = stemCandidates.concat(candidates);
        // lookup other words including nouns and adjectives
        candidates = findStemCandidates(STOPS, 'word', 'term_b', frags);
        if (candidates.length > 0)
            stemCandidates = stemCandidates.concat(candidates);
        candidates = findStemCandidates(WORDS, 'word', 'term_b', frags);
        if (candidates.length > 0)
            stemCandidates = stemCandidates.concat(candidates);
    }

    // find the longest match
    var maxlen = 0;
    for (var i = 0; i < stemCandidates.length; i++) {
        if (stemCandidates[i].stem.length >= maxlen)
            maxlen = stemCandidates[i].stem.length;
    }
    if (maxlen == 2 || maxlen == 3) {
        for (var i = 0; i < stemCandidates.length; i++) {
            if (stemCandidates[i].stem.length >= 2)
                stems.push(stemCandidates[i]);
        }
    } else {
        for (var i = 0; i < stemCandidates.length; i++) {
            if (stemCandidates[i].stem.length >= (maxlen - 1))
                stems.push(stemCandidates[i]);
        }
    }
    stems.sort(function (stem1, stem2) {
        if (stem2.exactMatch && !stem1.exactMatch)
            return 1;
        if (!stem2.exactMatch && stem1.exactMatch)
            return -1;
        if (stem2.stem.length > stem1.stem.length)
            return 1;
        if (stem2.stem.length < stem1.stem.length)
            return -1;
        if (stem2 > stem1)
            return 1;
        if (stem2 < stem1)
            return 1;
        return 0;
    });
    return stems
}

function findStemCandidates(list, pos, col, frags, exact) {
    var stems = new Array();
    for (var i = 0; i < list.length; i++) {
        var matches = matchesFrag(list[i][col], frags, exact);
        if (matches.length > 0) {
            for (var j = 0; j < matches.length; j++) {
                stems.push({
                    stem: matches[j].token,
                    exactMatch: matches[j].exactMatch,
                    pos: pos,
                    meta: list[i]
                });
            }
        }
    }
    return (stems.length > 0) ? stems : {};
}

function matchesFrag(term, frags, exact) {
    var matches = new Array();
    var termTokens = term.split(/[\\,،/ ]/);
    for (var i = 0; i < frags.length; i++) {
        var frag = normalize(frags[i]);
        for (var j = 0; j < termTokens.length; j++) {
            if (termTokens[j] == "")
                continue;
            var termToken = normalize(termTokens[j]);
            if (exact) {
                if (frag == termToken)
                    pushUniqueObject(matches, 'token', {
                        token: termTokens[j],
                        exactMatch: frags[i] == termTokens[j]
                    });
            } else if (frag == termToken || (frag.startsWith(termToken) || frag.endsWith(termToken))) {
                var n = getObjectIndexWithValue(matches, 'token', termTokens[j]);
                if (n < 0 || (n >= 0 && !matches[n].exactMatch))
                    if (n >= 0)
                        matches.splice(n, 1);
                pushUniqueObject(matches, 'token', {
                    token: termTokens[j],
                    exactMatch: frags[i] == termTokens[j]
                });
            }
        }
    }
    return matches;
}

function trimPrefixes(frags, frag) {
    pushUniqueValue(frags, frag);
    if (frag.length > 3 && frag.charAt(0).match(PREFIXES))
        trimPrefixes(frags, frag.substr(1));
    return
}

function trimSuffixes(frags, frag) {
    pushUniqueValue(frags, frag);
    if (frag.length > 3 && frag.charAt(frag.length - 1).match(SUFFIXES))
        trimSuffixes(frags, frag.substr(0, frag.length - 1));
    return;
}

function normalize(text) {
    return text.replace(/ث/, 'ت').replace(/ز/, 'ذ').replace(/ض/, 'ظ').replace(/س/, 'ص');
}

function stripDiacriticsFromList(list, colSource, colTarget) {
    for (var i = 0; i < list.length; i++)
        list[i][colTarget] = stripDiacritics(list[i][colSource]);
    return list;
}

function stripDiacritics(word) {
    word = word.replace(/[\u0640\u064b-\u065f]/g, '');
    word = word.replace(/[أإآ]/g, 'ا');
    return word;
}

function getObjectIndexWithValue(arr, prop, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][prop] == value)
            return i;
    }
    return -1;
}

function pushUniqueObject(arr, prop, obj) {
    var found = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][prop] == obj[prop]) {
            found = true;
            break;
        }
    }
    if (!found)
        arr.push(obj);
    return arr;
}

function pushUniqueValue(arr, value) {
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