"use strict";
const utils = require('./utils');
const DictionaryStore = require('./DictionaryStore');

const TERM_DELIM = /[\\,،/ ]/;
const COL_TERM_MAIN = "main";
const COL_TERM_ORIG = "term";
const COL_TERM = "term_norm";
const COL_DEF = "def";
const MAX_RESULTS = 200;

class Dictionary {

    pos;
    posDesc;
    altTerm;
    dict;

    constructor(pos, posDesc, altTerm) {
        this.posDesc = posDesc;
        this.pos = pos;
        this.altTerm = altTerm;
        this.init();
    }

    init() {
        var that = this;
        DictionaryStore.get(this.pos, function (docs) {
            console.log('Loaded ' + docs.length + ' ' + that.posDesc);
            that.dict = docs;
            if (that.altTerm)
                that.dict.forEach(function (item) {
                    item[COL_TERM_ORIG] = item[that.altTerm];
                    if (item[COL_DEF].startsWith('"'))
                        item[COL_DEF] = item[COL_DEF].substr(1);
                    if (item[COL_DEF].endsWith('"'))
                        item[COL_DEF] = item[COL_DEF].substr(0, item[COL_DEF].length - 1);
                });
            that.normalize()
            that.sort();
        });
    }

    items() {
        return this.dict;
    }

    item(n) {
        return this.dict[n];
    }

    findAll(values, exactly) {
        var matches = new Array();
        for (var i = 0; i < values.length; i++) {
            var value = utils.normalizeArabic(values[i]);
            try {
                var subMatches = this.findExact(value);
            } catch (e) {
                console.error('Error matching word: ' + value + '\n' + e);
                return matches;
            }
            for (var j = 0; j < subMatches.length; j++) {
                var n = -1;
                for (var k = 0; k < matches.length; k++) {
                    if (matches[k][COL_TERM_MAIN] == subMatches[j][COL_TERM_MAIN] && matches[k][COL_DEF] == subMatches[j][COL_DEF]) {
                        n = k;
                        break;
                    }
                }
                var push = false;
                if (n < 0)
                    push = true;
                else if (n >= 0 && matches[n].exact == false && subMatches[j].exact == true) {
                    matches.splice(n, 1);
                    push = true;
                }
                if (push)
                    matches.push({
                        pos: this.pos,
                        posDesc: this.posDesc,
                        exact: subMatches[j].exact,
                        partial: subMatches[j].partial,
                        main: subMatches[j][COL_TERM_MAIN],
                        term: subMatches[j][COL_TERM_ORIG],
                        def: subMatches[j][COL_DEF]
                    });
            }
        }
        return matches;
    }

    findExact(value) {
        if (value == 'احنا')
            var x = 1;
        var matches = new Array();
        var start = 0,
            end = this.dict.length - 1;
        while (start <= end) {
            var mid = Math.floor((start + end) / 2);
            if (this.dict[mid][COL_TERM] == value) {
                var n = mid;
                while (this.dict[n][COL_TERM] == value) {
                    if (!this.dict[n].deleted)
                        matches.push({
                            pos: this.pos,
                            posDesc: this.posDesc,
                            exact: true,
                            partial: value,
                            main: this.dict[n][COL_TERM_MAIN],
                            term: this.dict[n][COL_TERM_ORIG],
                            def: this.dict[n][COL_DEF]
                        });
                    if (n > 0)
                        n--;
                    else
                        break;
                }
                start = mid + 1;
            } else if (this.dict[mid][COL_TERM] < value)
                start = mid + 1;
            else
                end = mid - 1;
        }
        return matches;
    }

    search(value) {
        var matches = new Array();
        for (var i = 0; i < this.dict.length && i < MAX_RESULTS; i++) {
            var text = this.dict[i][COL_TERM] + ' ' + this.dict[i][COL_DEF];
            var n = text.toLowerCase().search(value.trim());
            if (n >= 0) {
                var boost = false;
                var start = ((n - 1) < 0) ? 0 : n - 1;
                var end = ((n + value.length) > (text.length - 1)) ? text.length - 1 : n + value.length;
                if (n == 0 || text[start].match(/[ ،,\/\\:;\-\(\))]/) && text[end].match(/[ ،,\/\\:;\-]\(\)/))
                    boost = true;

                var match = null;
                for (var j = 0; j < matches.length; j++) {
                    if (matches[j].id.equals(this.dict[i].id)) {
                        match = matches[j];
                        break;
                    }
                }
                if (!match) {
                    matches.push({
                        id: this.dict[i].id,
                        modified: this.dict[i].modified,
                        deleted: this.dict[i].deleted,
                        pos: this.pos,
                        posDesc: this.posDesc,
                        boost: boost,
                        exact: (this.dict[i][COL_TERM] == value),
                        partial: value,
                        main: this.dict[i][COL_TERM_MAIN],
                        terms0: this.dict[i].terms0,
                        terms1: this.dict[i].terms1,
                        def: this.dict[i][COL_DEF]
                    });
                }
            }
        }
        matches.sort(utils.sortBy({
            name: 'exact',
            reverse: true
        }, {
            name: 'boost',
            reverse: true
        }, 'main'));
        return matches;
    }

    normalize() {
        var normalized = new Array();
        for (var i = 0; i < this.dict.length; i++) {
            var tokens = this.dict[i][COL_TERM_ORIG].split(TERM_DELIM);
            for (var j = 0; j < tokens.length; j++) {
                if (this.dict[i].deleted)
                    var x = 1;
                if (!tokens[j] == "")
                    normalized.push({
                        id: this.dict[i]._id,
                        deleted: this.dict[i].deleted,
                        modified: this.dict[i].modified,
                        terms0: this.dict[i].terms0,
                        terms1: this.dict[i].terms1,
                        def: this.dict[i][COL_DEF],
                        main: tokens[0],
                        term: tokens[j],
                        term_norm: utils.normalizeArabic(utils.stripArabicDiacritics(tokens[j]))
                    });
            }
        }
        this.dict = normalized;
    }

    sort() {
        this.dict.sort(utils.sortBy(COL_TERM));
    }

}

module.exports = Dictionary;