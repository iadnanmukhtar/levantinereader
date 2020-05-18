"use strict";
const utils = require('./utils');
const Dictionary = require('./Dictionary');
const DictionaryStore = require('./DictionaryStore');
const Notifier = require('./Notifier');

const STOPS = new Dictionary('stop', 'Stop Word', 'terms0');
const WORDS = new Dictionary('word', 'General', 'terms0');
const VERBS_PAST = new Dictionary('verb', 'Past Tense', 'terms0');
const VERBS_PRES = new Dictionary('verb', 'Present Tense', 'terms1');

const PREFIXES = /[ك ل ا ه و ح ء س ب ي ن م ت ف ع]/;
const PREFIXES_WORD = /(ب|بال|ع|عال|هال|بهال|وبهال|فبهال|فهال|ف|فال|ل|لل|ك|كال|و|وب|وبال|وع|وعال|وف|وفال|ول|ولل|وك|وكال|فب|فبال|فل|فلل|ال|وال)/;
const PREFIXES_PRES = /(ف|و)?(ت|ي|ا|ن|بي|با|بت|ب|بن|من|حي|حت|حا|حن|سي|ست|سا|سن|لي|لت|لا|لن|ماي|مات|ما|مان|مابي|مابت|ماب|مابن|مامن|مي|مت|م|من|مب|مبت|مب|مبن|ممن)/;
const PREFIXES_NEG = /(م|ما)/;
const SUFFIXES = /[م ش ن ك ه ة ء ل ت ا ي و]/;
const SUFFIXES_WORD = /(ء|جي|ة|ات|يات|يين|ون|ان|ه|هما|هم|ها|هن|ك|كما|كم|كن|ي|نا|ئه|جيه|ته|اته|ياته|يينه|ونه|انه|ئهما|جيهما|تهما|اتهما|ياتهما|يينهما|ونهما|انهما|ئهم|جيهم|تهم|اتهم|ياتهم|يينهم|ونهم|انهم|ئها|جيها|تها|اتها|ياتها|يينها|ونها|انها|ئهن|جيهن|تهن|اتهن|ياتهن|يينهن|ونهن|انهن|ئك|جيك|تك|اتك|ياتك|يينك|ونك|انك|ئكما|جيكما|تكما|اتكما|ياتكما|يينكما|ونكما|انكما|ئكم|جيكم|تكم|اتكم|ياتكم|يينكم|ونكم|انكم|ئكو|جيكو|تكو|اتكو|ياتكو|يينكو|ونكو|انكو|ئكي|جيكي|تكي|اتكي|ياتكي|يينكي|ونكي|انكي|ئكن|جيكن|تكن|اتكن|ياتكن|يينكن|ونكن|انكن|ئني|جيني|تني|اتني|ياتني|يينني|ونني|انني|ئنا|جينا|تنا|اتنا|ياتنا|ييننا|وننا|اننا|ينه|ينهما|ينهم|ينها|ينهما|ينهن|ينك|ينكما|ينكم|ينكو|ينك|ينكي|ينكما|ينكن|ينني|يننا|يه|يهما|يهم|يها|يهما|يهن|يك|يكما|يكم|يكو|يك|يكي|يكما|يكن|يني|ينا|ين|ي|ا)/;
const SUFFIXES_PAST = /(ه|اه|وه|واه|ته|تاه|نه|تماه|تموه|تيه|تنه|ناه|هما|اهما|وهما|واهما|تهما|تاهما|نهما|تماهما|تموهما|تيهما|تنهما|ناهما|هم|اهم|وهم|واهم|تهم|تاهم|نهم|تماهم|تموهم|تيهم|تنهم|ناهم|ها|اها|وها|واها|تها|تاها|نها|تماها|تموها|تيها|تنها|ناها|هن|اهن|وهن|واهن|تهن|تاهن|نهن|تماهن|تموهن|تيهن|تنهن|ناهن|ك|اك|وك|واك|تك|تاك|نك|ناك|كما|اكما|وكما|واكما|تكما|تاكما|نكما|ناكما|كم|اكم|وكم|واكم|تكم|تاكم|نكم|ناكم|كو|اكو|وكو|واكو|تكو|تاكو|نكو|ناكو|كي|اكي|وكي|واكي|تكي|تاكي|نكي|ناكي|كن|اكن|وكن|واكن|تكن|تاكن|نكن|ناكن|ني|اني|وني|واني|تني|تاني|نني|تماني|تموني|تيني|تنني|نا|انا|ونا|وانا|تنا|تانا|ننا|تمانا|تمونا|تينا|تننا|له|اله|وله|واله|تله|تاله|نله|تماله|تموله|تيله|تنله|ناله|لهما|الهما|ولهما|والهما|تلهما|تالهما|نلهما|تمالهما|تمولهما|تيلهما|تنلهما|نالهما|لهم|الهم|ولهم|والهم|تلهم|تالهم|نلهم|تمالهم|تمولهم|تيلهم|تنلهم|نالهم|لها|الها|ولها|والها|تلها|تالها|نلها|تمالها|تمولها|تيلها|تنلها|نالها|لهن|الهن|ولهن|والهن|تلهن|تالهن|نلهن|تمالهن|تمولهن|تيلهن|تنلهن|نالهن|لك|الك|ولك|والك|تلك|تالك|نلك|نالك|لكما|الكما|ولكما|والكما|تلكما|تالكما|نلكما|نالكما|لكم|الكم|ولكم|والكم|تلكم|تالكم|نلكم|نالكم|لكو|الكو|ولكو|والكو|تلكو|تالكو|نلكو|نالكو|لكي|الكي|ولكي|والكي|تلكي|تالكي|نلكي|نالكي|لكن|الكن|ولكن|والكن|تلكن|تالكن|نلكن|نالكن|لي|الي|ولي|والي|تلي|تالي|نلي|تمالي|تمولي|تيلي|تنلي|لنا|النا|ولنا|والنا|تلنا|تالنا|نلنا|تمالنا|تمولنا|تيلنا|تنلنا|ا|و|وا|ت|تا|ن|تما|تمو|تي|تن)/;
const SUFFIXES_PRES = /(ه|ونه|واه|نه|يه|هما|ونهما|واهما|نهما|يهما|هم|ونهم|واهم|نهم|يهم|ها|ونها|واها|نها|يها|هن|ونهن|واهن|نهن|يهن|ك|ونك|واك|نك|كما|ونكما|واكما|نكما|كم|ونكم|واكم|نكم|كو|ونكو|واكو|نكو|كي|ونكي|واكي|نكي|كن|ونكن|واكن|نكن|ني|ونني|واني|نني|يني|نا|وننا|وانا|ننا|ينا|له|ونله|واله|نله|يله|لهما|ونلهما|والهما|نلهما|يلهما|لهم|ونلهم|والهم|نلهم|يلهم|لها|ونلها|والها|نلها|يلها|لهن|ونلهن|والهن|نلهن|يلهن|لك|ونلك|والك|نلك|لكما|ونلكما|والكما|نلكما|لكم|ونلكم|والكم|نلكم|لكو|ونلكو|والكو|نلكو|لكي|ونلكي|والكي|نلكي|لكن|ونلكن|والكن|نلكن|لي|ونلي|والي|نلي|يلي|لنا|ونلنا|والنا|نلنا|يلنا|ون|وا|ن|ي|و|وه|وهما|وهم|وها|وهن|وك|وكما|وكم|وكو|وكي|وكن|وني|ونا|وله|ولهما|ولهم|ولها|ولهن|ولك|ولكما|ولكم|ولكو|ولكي|ولكن|ولي|ولنا)/;
const SUFFIXES_NEG = /(ش|وش)/;

class Matcher {

    static DICTS = [STOPS, WORDS, VERBS_PAST, VERBS_PRES];

    static match(word) {
        var match = true;
        var stems = Matcher.getStems(utils.stripAllArabicDiacritics(word));
        if (stems.length == 0) {
            match = false;
            stems = null;
        }
        return {
            word: word,
            match: match,
            exact: (stems && stems[0].exact),
            stems: stems
        };
    }

    static getStems(word) {
        // find matches in dictionary
        // lookup stop words and stop processing additional search
        stems = STOPS.findAll([word], true);
        if (stems.length > 0)
            return stems;
        else {

            var candidates = new Array();

            // create partial word fragments by sripping affixes one by one
            var partials = Matcher.removeAffix(word);

            // find partially matching stop words
            candidates = candidates.concat(STOPS.findAll(partials));

            // find partially matching non-verbs
            var partialsWord = new Array().concat(partials);
            for (var i = 0; i < partialsWord.length; i++) {
                utils.pushUnique(partialsWord, partialsWord[i].replace(/(ات)$/, //
                    'اة'));
                utils.pushUnique(partialsWord, partialsWord[i].replace(/(ت|ات|ين)$/, //
                    'ة'));
                utils.pushUnique(partialsWord, partialsWord[i].replace(/ا$/, //
                    'اء'));
                utils.pushUnique(partialsWord, partialsWord[i].replace(/اء$/, //
                    'ا'));
            }
            candidates = candidates.concat(WORDS.findAll(partialsWord));

            // find partially matching present tense verbs
            var partialsPres = new Array().concat(partials);
            for (var i = 0; i < partialsPres.length; i++) {
                if (partialsPres[i].length >= 3) {
                    partialsPres[i] = partialsPres[i].replace(/^(بت|بي|بن|من)/, //
                        'ي');
                    partialsPres[i] = partialsPres[i].replace(/^(ت|ن|ب|ا)/, //
                        'ي');
                }
                utils.pushUnique(partialsPres, partialsPres[i].replace(/و$/, //
                    'ي'));
                if (!partialsPres[i].match(/^(ي|ب)/)) {
                    utils.pushUnique(partialsPres, 'ي' + partialsPres[i]);
                    utils.pushUnique(partialsPres, 'يا' + partialsPres[i]);
                    utils.pushUnique(partialsPres, 'يو' + partialsPres[i]);
                }
            }
            candidates = candidates.concat(VERBS_PRES.findAll(partialsPres));

            // find partially matching past tense verbs
            var partialsPast = new Array().concat(partials);
            var n = partialsPast.length
            for (var i = 0; i < n; i++) {
                if (partialsPast[i].length >= 4) {
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/ي$/, //
                        'ى'));
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/ا$/, //
                        'ى'));
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/ا$/, //
                        ''));
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/(ت|و|وا|تي|تو|تم|نا)$/, //
                        ''));
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/(ي|يت|و|وا|يتي|يتم|يتو|ينا)$/, //
                        'ى'));
                }
                utils.pushUnique(partialsPast, partialsPast[i] + 'ا');
                utils.pushUnique(partialsPast, partialsPast[i] + 'ى');
                utils.pushUnique(partialsPast, partialsPast[i].replace(/^ا/, //
                    'ي'));
                utils.pushUnique(partialsPast, partialsPast[i].replace(/^([^ا])([^ا])(.)$/, //
                    '$1ا$2'));
            }
            candidates = candidates.concat(VERBS_PAST.findAll(partialsPast));
        }

        // reject invalid matches
        for (var i = 0; i < candidates.length; i++) {
            if (!Matcher.isValidMatch(word, candidates[i])) {
                candidates[i].exact = false;
                candidates[i].reject = true;
            }
        }

        // collect only unique candidates
        var stems = new Array();
        for (var i = 0; i < candidates.length; i++) {
            var found = false;
            for (var j = 0; j < stems.length; j++) {
                if (stems[j].id == candidates[i].id && stems[j].exact == candidates[i].exact) {
                    found = true;
                    break;
                }
            }
            if (!found)
                stems.push(candidates[i]);
        }

        // collect only exact stems (if any)
        var exactStems = new Array();
        for (var i = 0; stems && i < stems.length; i++) {
            if (stems[i].exact)
                exactStems.push(stems[i]);
        }
        if (exactStems.length > 0)
            stems = exactStems;

        // sort by exactness of match, then by length, then by alphabet order
        stems.sort(function (stem1, stem2) {
            if (stem2.exact && !stem1.exact)
                return 1;
            if (!stem2.exact && stem1.exact)
                return -1;
            if (stem2.partial.length > stem1.partial.length)
                return 1;
            if (stem2.partial.length < stem1.partial.length)
                return -1;
            if (stem2 > stem1)
                return 1;
            if (stem2 < stem1)
                return 1;
            return 0;
        });
        return stems
    }

    static isValidMatch(word, candidate) {
        word = utils.normalizeArabic(word);
        var stem = candidate.partial;

        // pass 1
        if (word.endsWith('ة') && candidate.pos == 'verb')
            return false;
        if (candidate.posDesc.startsWith('Pres')) {
            stem = stem.replace(/^(ي)/, //
                '');
        }
        if (candidate.posDesc.startsWith('Past')) {
            stem = stem.replace(/(.)ا(.)$/, //
                '$1ا?$2');
            stem = stem.replace(/(ا)$/, //
                '($1|ي|)');
            stem = stem.replace(/(ى)$/, //
                '($1|)');
            stem += '(ي)?';
        }
        stem = stem.replace(/(ة)$/, //
            '($1|ت|ات)');
        stem = stem.replace(/(ى)$/, //
            '($1|ي|ا|)');
        stem = stem.replace(/(ا|أ|إ|ء)$/, //
            '($1|ؤ|ئ|)');
        if (candidate.pos == 'verb')
            stem = stem.replace(/(ي)$/, //
                '($1|و)');

        // pass 2 - prefixes and suffix seem valid
        var m = new RegExp('^(' + PREFIXES.source + '*)(' + stem + ')(' + SUFFIXES.source + '*)$').exec(word);
        if (m) {
            if (m[1].length > 0) {
                if (candidate.posDesc.startsWith('Pres')) {
                    // pass 3a - verb prefixes are vaid
                    if (!new RegExp('^(' + PREFIXES_NEG.source + ')?(' + PREFIXES_PRES.source + ')?(' + stem + ')').exec(word))
                        return false;
                } else {
                    // pass 3b - word prefixes are valid
                    if (!new RegExp('^(' + PREFIXES_NEG.source + ')?(' + PREFIXES_WORD.source + ')?(' + stem + ')').test(word))
                        return false;
                }
            }
            if (m[3] && m[3].length > 0) {
                if (candidate.posDesc.startsWith('Past')) {
                    // pass 4a - past tense suffixes are vaid
                    if (!new RegExp('(' + stem + ')((' + SUFFIXES_PAST.source + ')?(' + SUFFIXES_NEG.source + ')?)$').test(word))
                        return false;
                } else if (candidate.posDesc.startsWith('Pres')) {
                    // pass 4b - present tense suffixes are vaid
                    if (!new RegExp('(' + stem + ')((' + SUFFIXES_PRES.source + ')?(' + SUFFIXES_NEG.source + ')?)$').test(word))
                        return false;
                } else {
                    // pass 4c - word suffixes are valid
                    if (!new RegExp('(' + stem + ')((' + SUFFIXES_WORD.source + ')?(' + SUFFIXES_NEG.source + ')?)$').test(word))
                        return false;
                }
            }
            return true;
        }
        return false;
    }

    static removeAffix(word) {
        var maxLength = 2;
        if (word.length <= 4)
            maxLength = 1;
        var i = 0;
        var j = 0;
        var partials = new Array();
        var partial = word;
        utils.pushUnique(partials, partial);
        var partial1 = partial;
        while (partial1.length > maxLength) {
            var trimmed1 = Matcher.removePrefix(partial1);
            utils.pushUnique(partials, trimmed1);
            var partial2 = partial1;
            while (partial2.length > maxLength) {
                var trimmed2 = Matcher.removeSuffix(partial2);
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

    static removePrefix(frag) {
        if (frag.charAt(0).match(PREFIXES))
            return frag.substr(1);
        return frag;
    }

    static removeSuffix(frag) {
        if (frag.charAt(frag.length - 1).match(SUFFIXES))
            return frag.substr(0, frag.length - 1);
        return frag;
    }

    static async addWord(pos, word, def) {
        await DictionaryStore.add({
            pos: pos,
            terms0: word,
            terms1: '',
            def: def
        }, function (result) {
            Notifier.notifyOnAdd(pos, word, def);
        });
        Matcher.refreshAllDicts();
    }

    static addVerb(pos, past, pres, def) {
        DictionaryStore.add({
            pos: pos,
            terms0: past,
            terms1: pres,
            def: def
        }, function (result) {
            Notifier.notifyOnAdd(pos, past + "،" + pres, def);
        });
        Matcher.refreshAllDicts();
    }

    static updateWord(id, terms0, terms1, def) {
        DictionaryStore.update(id, {
            terms0: terms0,
            terms1: terms1,
            def: def
        }, function (result) {
            Notifier.notifyOnUpdate(id, terms0 + ',' + terms1, def);
        });
        Matcher.refreshAllDicts();
    }

    static deleteWord(id, terms0, terms1) {
        DictionaryStore.update(id, {
            deleted: true
        }, function (result) {
            Notifier.notifyOnDelete(id, terms0 + ',' + terms1);
        });
        Matcher.refreshAllDicts();
    }

    static refreshAllDicts() {
        Matcher.DICTS.forEach(function (dict) {
            dict.init();
        });
    }

}

module.exports = Matcher;