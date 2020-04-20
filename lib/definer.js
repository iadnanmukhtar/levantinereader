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

var define = function (word) {
    const bw = bwconverter.arab2bw(stripDiacritics(word));
    var poss = new Array();

    var stop = matchesWordStop(bw);
    if (!stop)
        stop = matchesWordStop(bw, true, false);
    if (!stop)
        stop = matchesWordStop(bw, false, true);
    if (!stop)
        stop = matchesWordStop(bw, true, true);
    if (stop) {
        addPOS(poss, stop);
    } else {
        addPOS(poss, findVerbPresentTense(bw));
        addPOS(poss, findVerbPresentTense(bw, true, false));
        addPOS(poss, findVerbPresentTense(bw, false, true));
        addPOS(poss, findVerbPresentTense(bw, true, true));
        addPOS(poss, findVerbImperitiveTense(bw));
        addPOS(poss, findVerbImperitiveTense(bw, true));
        addPOS(poss, findVerbPastTense(bw));
        addPOS(poss, findVerbPastTense(bw, true));
        addPOS(poss, matchesWordNonVerb(bw));
        addPOS(poss, matchesWordNonVerb(bw, true, false));
        addPOS(poss, matchesWordNonVerb(bw, false, true));
        addPOS(poss, matchesWordNonVerb(bw, true, true));
    }

    var error = true;
    for (var i = 0; i < poss.length; i++) {
        if (!poss[i].error) {
            error = false;
            break;
        }
    }

    return {
        word: word,
        bw: bw,
        error: error,
        pos: poss
    };
}

module.exports = {
    define: define
}

function matchesWordStop(bw, incPrefix, incSuffix) {
    var name = 'stop';
    var meta = null;
    var stem = "";
    var m = null;
    if (incPrefix && incSuffix)
        m = bw.match(/^w?(.+?)?(h|hm|hn|hA|k|ky|km|kn|na|w|wA|y)?$/);
    else if (incPrefix)
        m = bw.match(/^w?(.+?)$/);
    else if (incSuffix)
        m = bw.match(/^(.+?)(h|hm|hn|hA|k|ky|km|kn|na|w|wA|y)$/);
    else
        m = bw.match(/^(.+?)$/);
    if (m !== null) {
        const word = bwconverter.bw2arab(m[1]);
        stem = word;
        var meta = matchesTerm(STOPS, 'term_b', word);
        if (meta) {
            return {
                stem: stem,
                pos: name,
                error: false,
                meta: meta
            };
        }
    }
    return null;
}

function matchesWordNonVerb(bw, incPrefix, incSuffix) {
    var name = 'non-verb';
    var error = true;
    var meta = null;
    var stem = "";
    var stemGroup = 0;
    var m = null;
    if (incPrefix && incSuffix) {
        m = bw.match(/^(ll|[wbE](Al)?|l)?(.+?)(h|w|hm|hn|hA|k|ky|km|kn|na|y)?$/);
        stemGroup = 3;
    } else if (incPrefix) {
        m = bw.match(/^(ll|[wbE](Al)?|l)?(.+?)$/);
        stemGroup = 3;
    } else if (incSuffix) {
        m = bw.match(/^(.+?)(h|w|hm|hn|hA|k|ky|km|kn|na|y)?$/);
        stemGroup = 1;
    } else {
        m = bw.match(/^(.+?)$/);
        stemGroup = 1;
    }
    if (m !== null) {
        const word = bwconverter.bw2arab(m[stemGroup]);
        stem = word;
        meta = matchesTerm(WORDS, 'term_b', word, true);
        if (meta)
            error = false;
    }
    return {
        stem: stem,
        pos: name,
        error: error,
        meta: meta
    };
}

function findVerbPresentTense(bw, incPrefix, incSuffix) {
    var name = 'present';
    var error = true;
    var meta = null;
    var stem = "";
    var m = null;
    if (incPrefix && incSuffix)
        m = bw.match(/^w?(by|bt|b|mn|bn|y|t|n|A)(.+?)(w|wA|ny)?l?(h|hm|hn|hA|k|kw|km|na)?$/);
    else if (incPrefix)
        m = bw.match(/^w?(by|bt|b|mn|bn|y|t|n|A)(.+?)(w|wA|ny)?$/);
    else if (incSuffix)
        m = bw.match(/^(by|bt|b|mn|bn|y|t|n|A)(.+?)(w|wA|ny)?l?(h|hm|hn|hA|k|kw|km|na)?$/);
    else
        m = bw.match(/^(by|bt|b|mn|bn|y|t|n|A)(.+?)(w|wA|ny)$/);
    if (m !== null) {
        const verb = bwconverter.bw2arab('y' + m[2]);
        stem = verb;
        meta = matchesTerm(VERBS, 'pres_b', verb);
        if (meta)
            error = false;
    }
    return {
        stem: stem,
        pos: name,
        error: error,
        meta: meta
    };
}

function findVerbImperitiveTense(bw) {
    var name = 'present';
    var error = true;
    var meta = null;
    var stem = "";
    var m = bw.match(/^w?(A?.+?)(w|wA|ny)$/);
    if (m !== null) {
        const verb = bwconverter.bw2arab('y' + m[1]);
        stem = verb;
        var meta = matchesTerm(VERBS, 'pres_b', verb);
        if (meta)
            error = false;
    }
    return {
        stem: stem,
        pos: name,
        error: error,
        meta: meta
    };
}

function findVerbPastTense(bw, incPrefix) {
    var name = 'past';
    var error = true;
    var meta = null;
    var stem = "";
    var m = null;
    if (incPrefix)
        m = bw.match(/^w?(.+?)(t|wA|ty|tw|tm|twA|nA)?$/);
    else
        m = bw.match(/(.+?)(t|wA|ty|tw|tm|twA|nA)?$/);
    if (m !== null) {
        var verb = m[1].replace(/y$/, "[yY]");
        verb = bwconverter.bw2arab(verb);
        stem = verb;
        var meta = matchesTerm(VERBS, 'past_b', verb);
        if (meta)
            error = false;
    }
    return {
        stem: stem,
        pos: name,
        error: error,
        meta: meta
    };
}

function matchesTerm(list, col, word, incSoundPlural) {
    var meta = new Array();
    for (var i = 0; i < list.length; i++) {
        try {
            const regex = new RegExp('^(' + word + ')$', 'g');
            if (matchesAnyToken(list[i][col], regex, incSoundPlural))
                meta.push(list[i]);
        } catch (e) {}
    }
    return (meta.length > 0) ? meta : null;
}

function matchesAnyToken(text, regex, incSoundPlural) {
    var tokens = text.split(/[\\,،/ ]/);
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].match(regex))
            return true;
        if (incSoundPlural) {
            var plural = tokens[i].replace(/ة$/, "ات");
            if (plural.match(regex))
                return true;
            plural = tokens[i].replace(/ة$/, "ين");
            if (plural.match(regex))
                return true;
            plural = tokens[i] + 'ات';
            if (plural.match(regex))
                return true;
            plural = tokens[i] + 'ين';
            if (plural.match(regex))
                return true;
        }
    }
    return false;
}

function addPOS(poss, pos) {
    // var found = false;
    // for (var i = 0; i < poss.length; i++) {
    //     if (poss[i].stem == pos.stem && poss[i].error == pos.error) {
    //         found = true;
    //     }
    // }
    // if (!found)
        poss.push(pos);
}

function stripDiacritics(word) {
    word = word.replace(/[\u0640\u064b-\u065f]/g, '');
    word = word.replace(/[أإآ]/g, 'ا');
    return word;
}