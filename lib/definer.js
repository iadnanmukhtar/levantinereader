const fs = require('fs');
const csv = require('csv-parse/lib/sync');
const bwconverter = require('../lib/buckwalter-converter-node');

const STOPS = csv(fs.readFileSync(__dirname + "/../assets/levantine.arabic.stop.tsv"), {
    columns: true,
    delimiter: '\t',
    quote: false
});
const WORDS = csv(fs.readFileSync(__dirname + "/../assets/levantine.arabic.words.tsv"), {
    columns: true,
    delimiter: '\t',
    quote: false
});
const VERBS = csv(fs.readFileSync(__dirname + "/../assets/levantine.arabic.verbs.tsv"), {
    columns: true,
    delimiter: '\t',
    quote: false
});

const PREFIXES = /[ك ل ا و س ب ي ن م ت ف ع]/;
const SUFFIXES = /[ن ك ه ة ت ا ي و]/;

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

    var frags = new Array();
    trimPrefixes(frags, word);
    trimSuffixes(frags, word);

    var stemCandidates = new Array();
    // find matches in dictionary

    // lookup stop words and stop processing additional search
    var candidates = findStemCandidates(STOPS, 'stop word', 'term_b', frags, true);
    if (candidates) {
        return stemCandidates.concat(candidates);
    } else {
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
        if (candidates)
            stemCandidates = stemCandidates.concat(candidates);
        // lookup past tense
        var fragsPast = new Array().concat(frags);
        for (var i = 0; i < fragsPast.length; i++) {
            if (fragsPast[i].length >= 4) {
                pushUnique(fragsPast, fragsPast[i].replace(/ي$/, //
                    'ى'));
                pushUnique(fragsPast, fragsPast[i].replace(/(ت|و|وا|تي|تو|تم|نا)$/, //
                    ''));
                pushUnique(fragsPast, fragsPast[i].replace(/(ي|يت|و|وا|يتي|يتم|يتو|ينا)$/, //
                    'ى'));
            }
        }
        candidates = findStemCandidates(VERBS, 'past tense', 'past_b', fragsPast);
        if (candidates)
            stemCandidates = stemCandidates.concat(candidates);
        // lookup other words including nouns and adjectives
        candidates = findStemCandidates(WORDS, 'word', "term_b", frags);
        if (candidates)
            stemCandidates = stemCandidates.concat(candidates);
    }
    // find the longest match
    var maxlen = 0;
    for (var i = 0; i < stemCandidates.length; i++) {
        if (stemCandidates[i].stem.length >= maxlen)
            maxlen = stemCandidates[i].stem.length;
    }
    if (maxlen) {
        for (var i = 0; i < stemCandidates.length; i++) {
            if (stemCandidates[i].stem.length >= 2)
                stems.push(stemCandidates[i]);
        }
    } else {
        for (var i = 0; i < stemCandidates.length; i++) {
            if (stemCandidates[i].stem.length == maxlen)
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
        var match = matchesFrag(list[i][col], frags, exact);
        if (match && match.token.length > 0)
            stems.push({
                stem: match.token,
                exactMatch: match.exactMatch,
                pos: pos,
                meta: list[i]
            });
    }
    return (stems.length > 0) ? stems : null;
}

function matchesFrag(text, frags, exact) {
    var tokens = text.split(/[\\,،/ ]/);
    for (var i = 0; i < frags.length; i++) {
        for (var j = 0; j < tokens.length; j++) {
            var frag = normalize(frags[i]);
            var token = normalize(tokens[j]);
            if (exact) {
                if (frag == token)
                    return {
                        token: tokens[j],
                        exactMatch: frags[i] == tokens[j]
                    };
            } else if (frag.startsWith(token) || frag.endsWith(token)) {
                return {
                    token: tokens[j],
                    exactMatch: frags[i] == tokens[j]
                };
            }
        }
    }
    return null;
}

function trimPrefixes(frags, frag) {
    pushUnique(frags, frag);
    if (frag.length > 3 && frag.charAt(0).match(PREFIXES))
        trimPrefixes(frags, frag.substr(1));
    return
}

function trimSuffixes(frags, frag) {
    pushUnique(frags, frag);
    if (frag.length > 3 && frag.charAt(frag.length - 1).match(SUFFIXES))
        trimSuffixes(frags, frag.substr(0, frag.length - 1));
    return;
}

function normalize(text) {
    return text.replace(/ث/, 'ت').replace(/ز/, 'ذ').replace(/ض/, 'ظ').replace(/س/, 'ص');
}

function stripDiacritics(word) {
    word = word.replace(/[\u0640\u064b-\u065f]/g, '');
    word = word.replace(/[أإآ]/g, 'ا');
    return word;
}

function pushUnique(arr, str) {
    if (!arr.includes(str))
        arr.push(str);
}