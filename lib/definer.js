const fs = require('fs');
const csv = require('csv-parse/lib/sync');
const utils = require('./utils');
const Dictionary = require('./Dictionary');

const STOPS = new Dictionary('Stop Word', 'levantine.arabic.stop.tsv');
const WORDS = new Dictionary('General', 'levantine.arabic.words.tsv');
const VERBS_PAST = new Dictionary('Past Tense', 'levantine.arabic.verbs.tsv', 'past');
const VERBS_PRES = new Dictionary('Present Tense', 'levantine.arabic.verbs.tsv', 'pres');

const DICTS = [STOPS, WORDS, VERBS_PAST, VERBS_PRES];

const PREFIXES = /[ك ل ا ه و س ب ي ن م ت ف ع]/;
const SUFFIXES = /[م ن ك ه ة ت ا ي و]/;

var define = function (word) {
    var match = true;
    var stems = getStems(utils.stripArabicDiacritics(word));
    if (stems.length == 0) {
        match = false;
        stems = null;
    }
    var exact = false;
    for (var i = 0; stems && i < stems.length; i++) {
        exact = stems[i].exact
        if (exact)
            break;
    }
    return {
        word: word,
        match: match,
        exact: exact,
        stems: stems
    };
}

function getStems(word) {
    var stems = new Array();

    // find matches in dictionary
    // lookup stop words and stop processing additional search
    stems = STOPS.findAll([word], true);
    if (stems.length > 0)
        return stems;
    else {

        var candidates = new Array();

        // create partial word fragments by sripping affixes one by one
        var partials = removeAffix(word);

        // find partially matching stop words
        candidates = candidates.concat(STOPS.findAll(partials));

        // find partially matching non-verbs
        var partialsWord = new Array().concat(partials);
        for (var i = 0; i < partialsWord.length; i++) {
            utils.pushUnique(partialsWord, partialsWord[i].replace(/(ة|ات|ين)$/, //
                ''));
        }
        candidates = candidates.concat(WORDS.findAll(partialsWord));

        // find partially matching present tense verbs
        var partialsPres = new Array().concat(partials);
        for (var i = 0; i < partialsPres.length; i++) {
            if (partialsPres[i].length >= 3) {
                partialsPres[i] = partialsPres[i].replace(/^(بت|بي|بن|من)/, //
                    'ي');
                partialsPres[i] = partialsPres[i].replace(/^(ت|ي|ن|ب|ا)/, //
                    'ي');
            }
        }
        candidates = candidates.concat(VERBS_PRES.findAll(partialsPres));

        // find partially matching past tense verbs
        var partialsPast = new Array().concat(partials);
        for (var i = 0; i < partialsPast.length; i++) {
            if (partialsPast[i].length >= 4) {
                utils.pushUnique(partialsPast, partialsPast[i].replace(/ي$/, //
                    'ى'));
                utils.pushUnique(partialsPast, partialsPast[i].replace(/(ت|و|وا|تي|تو|تم|نا)$/, //
                    ''));
                utils.pushUnique(partialsPast, partialsPast[i].replace(/(ي|يت|و|وا|يتي|يتم|يتو|ينا)$/, //
                    'ى'));
            }
            utils.pushUnique(partialsPast, partialsPast[i].replace(/^([^ا])([^ا])(.)$/, //
                '$1ا$2'));
        }
        candidates = candidates.concat(VERBS_PAST.findAll(partialsPast));
    }

    // find the longest partials match unless length is small
    var maxlen = 0;
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].partial.length >= maxlen)
            maxlen = candidates[i].partial.length;
    }
    if (maxlen == 2 || maxlen == 3) {
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i].partial.length >= 2)
                stems.push(candidates[i]);
        }
    } else {
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i].partial.length >= (maxlen - 1))
                stems.push(candidates[i]);
        }
    }
    // sort by exactness of match, then by length, then by alphabet order
    stems.sort(function (stem1, stem2) {
        if (stem2.exact && !stem1.exact)
            return 1;
        if (!stem2.exact && stem1.exact)
            return -1;
        if (stem2.main.length > stem1.main.length)
            return 1;
        if (stem2.main.length < stem1.main.length)
            return -1;
        if (stem2 > stem1)
            return 1;
        if (stem2 < stem1)
            return 1;
        return 0;
    });
    return stems
}

function removeAffix(word) {
    var i = 0;
    var j = 0;
    var partials = new Array();
    var partial = word;
    utils.pushUnique(partials, partial);
    var partial1 = partial;
    while (partial1.length > 2) {
        var trimmed1 = removePrefix(partial1);
        utils.pushUnique(partials, trimmed1);
        var partial2 = partial1;
        while (partial2.length > 2) {
            var trimmed2 = removeSuffix(partial2);
            utils.pushUnique(partials, trimmed2);
            if (trimmed2 == partial2)
                break;
            partial2 = trimmed2;
            if (j++ > 50) {
                console.log(word + ': stuck in outer loop');
                break;
            }
        }
        if (trimmed1 == partial1)
            break;
        partial1 = trimmed1;
        if (i++ > 50) {
            console.log(word + ': stuck in inner loop');
            break;
        }
    }
    return partials;
}

function removePrefix(frag) {
    if (frag.charAt(0).match(PREFIXES))
        return frag.substr(1);
    return frag;
}

function removeSuffix(frag) {
    if (frag.charAt(frag.length - 1).match(SUFFIXES))
        return frag.substr(0, frag.length - 1);
    return frag;
}

module.exports = {
    define: define,
    DICTS: DICTS,
    removeAffix: removeAffix
}