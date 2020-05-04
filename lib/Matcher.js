"use strict";
const utils = require('./utils');
const Dictionary = require('./Dictionary');
const DictionaryStore = require('./DictionaryStore');
const Notifier = require('./Notifier');

const STOPS = new Dictionary('stop', 'Stop Word', 'terms0');
const WORDS = new Dictionary('word', 'General', 'terms0');
const VERBS_PAST = new Dictionary('verb', 'Past Tense', 'terms0');
const VERBS_PRES = new Dictionary('verb', 'Present Tense', 'terms1');

const PREFIXES = /[ك ل ا ه و ح س ب ي ن م ت ف ع]/;
const PREFIXES_WORD = /(ب|بال|ع|عال|هال|ف|فال|ل|لل|ك|كال|و|وب|وبال|وع|وعال|وف|وفال|ول|ولل|وك|وكال|فب|فبال|فل|فلل|ال|وال)/;
const PREFIXES_PRES = /(ف|و)?(ت|ا|ن|بي|با|بت|ب|بن|من|حي|حت|حا|حن|سي|ست|سا|سن|لي|لت|لا|لن|ماي|مات|ما|مان|مابي|مابت|ماب|مابن|مامن|مي|مت|م|من|مب|مبت|مب|مبن|ممن)/;
const SUFFIXES = /[م ن ك ه ة ت ل ا ي و]/;

class Matcher {

    static DICTS = [STOPS, WORDS, VERBS_PAST, VERBS_PRES];

    static match(word) {
        var match = true;
        var stems = Matcher.getStems(utils.stripArabicDiacritics(word));
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

    static getStems(word) {
        var stems = new Array();

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
                //utils.pushUnique(partialsWord, partialsWord[i].replace(/(ئ)$/, //
                //    'ء'));
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
                utils.pushUnique(partialsPres, partialsPres[i].replace(/و$/, //
                    'ي'));
                if (!partialsPres[i].match(/^(ي|ب)/))
                    utils.pushUnique(partialsPres, 'ي' + partialsPres[i]);
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
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/(ت|و|وا|تي|تو|تم|نا)$/, //
                        ''));
                    utils.pushUnique(partialsPast, partialsPast[i].replace(/(ي|يت|و|وا|يتي|يتم|يتو|ينا)$/, //
                        'ى'));
                }
                utils.pushUnique(partialsPast, partialsPast[i].replace(/^ا/, //
                    'ي'));
                utils.pushUnique(partialsPast, partialsPast[i] + 'ى');
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

        // find the longest partials match unless length is small
        var maxlen = 0;
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i].partial.length >= maxlen)
                maxlen = candidates[i].partial.length;
        }
        if (maxlen == 2 || maxlen == 3) {
            for (var i = 0; i < candidates.length; i++) {
                if (!candidates[i].reject && candidates[i].partial.length >= 2)
                    stems.push(candidates[i]);
            }
        } else {
            for (var i = 0; i < candidates.length; i++) {
                if (!candidates[i].reject && candidates[i].partial.length >= (maxlen - 1))
                    stems.push(candidates[i]);
            }
        }
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
        if (candidate.posDesc == 'Present Tense')
            stem = stem.substr(1);
        if (candidate.posDesc == 'Past Tense')
            stem = stem.replace(/(.)ا(.)$/, //
                "$1ا?$2");
        stem = stem.replace(/(ة)$/, //
            '($1|ت|ات)');
        stem = stem.replace(/(ى)$/, //
            '($1|ي|ا||)');
        stem = stem.replace(/(ا|أ|إ|ء)$/, //
            '($1|ؤ|ئ)');
        if (candidate.pos == 'verb')
            stem = stem.replace(/(ي)$/, //
                '($1|و)');

        // pass 2 - prefixes and suffix seem valid
        var m = new RegExp('^(' + PREFIXES.source + '*)(' + stem + ')(' + SUFFIXES.source + '*)$').exec(word);
        if (m) {
            if (m[1].length > 0) {
                // pass 3a - verb prefixes are vaid
                if (candidate.posDesc.startsWith('Present')) {
                    m = new RegExp('^(' + PREFIXES_PRES.source + ')(' + stem + ')').exec(word);
                    if (!m)
                        return false;
                } else {
                    // pass 3b - word prefixes are valid
                    if (!new RegExp('^(' + PREFIXES_WORD.source + ')(' + stem + ')').test(word))
                        return false;
                }
            }
            return true;
        }
        return false;
    }

    static removeAffix(word) {
        var i = 0;
        var j = 0;
        var partials = new Array();
        var partial = word;
        utils.pushUnique(partials, partial);
        var partial1 = partial;
        while (partial1.length > 2) {
            var trimmed1 = Matcher.removePrefix(partial1);
            utils.pushUnique(partials, trimmed1);
            var partial2 = partial1;
            while (partial2.length > 2) {
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