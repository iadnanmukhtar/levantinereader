const fs = require('fs');
const csv = require('csv-parse/lib/sync');
const utils = require('./utils');

const TERM_DELIM = /[\\,،/ ]/;
const COL_TERM_MAIN = "main";
const COL_TERM_ORIG = "term";
const COL_TERM = "term_norm";
const COL_DEF = "def";

class Dictionary {

    name;
    dict;

    constructor(name, filename, altTerm) {
        this.name = name;
        this.dict = csv(fs.readFileSync(__dirname + '/../assets/' + filename), {
            columns: true,
            delimiter: '\t',
            quote: false
        });
        if (altTerm)
            this.dict.forEach(function (item) {
                item.term = item[altTerm];
            });
        this.normalize()
        this.sort();
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
            var subMatches;
            if (exactly)
                subMatches = this.findExact(value);
            else
                subMatches = this.findStartsWith(value);
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
                        pos: this.name,
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
        var start = 0,
            end = this.dict.length - 1;
        while (start <= end) {
            var mid = Math.floor((start + end) / 2);
            if (this.dict[mid][COL_TERM] == value)
                return [{
                    pos: this.name,
                    exact: true,
                    partial: value,
                    main: this.dict[mid][COL_TERM_MAIN],
                    term: this.dict[mid][COL_TERM_ORIG],
                    def: this.dict[mid][COL_DEF]
                }];
            else if (this.dict[mid][COL_TERM] < value)
                start = mid + 1;
            else
                end = mid - 1;
        }
        return [];
    }

    findStartsWith(value) {
        var matches = new Array();
        var start = 0,
            end = this.dict.length - 1;
        while (start <= end) {
            var mid = Math.floor((start + end) / 2);
            if (this.dict[mid][COL_TERM].startsWith(value)) {
                matches.push({
                    pos: this.name,
                    exact: (this.dict[mid][COL_TERM] == value),
                    partial: value,
                    main: this.dict[mid][COL_TERM_MAIN],
                    term: this.dict[mid][COL_TERM_ORIG],
                    def: this.dict[mid][COL_DEF]
                });
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
        for (var i = 0; i < this.dict.length; i++) {
            var text = this.dict[i][COL_TERM] + ' ' + this.dict[i][COL_DEF];
            var n = text.search(value);
            if (n >= 0) {
                var boost = false;
                if (n == 0 || text[n-1].match(/[ ،,\/\\:;\-]/))
                    boost = true;
                matches.push({
                    pos: this.name,
                    boost: boost,
                    exact: (this.dict[i][COL_TERM] == value),
                    partial: value,
                    main: this.dict[i][COL_TERM_MAIN],
                    term: this.dict[i][COL_TERM_ORIG],
                    def: this.dict[i][COL_DEF]
                });
            }
        }
        matches.sort(function(item1, item2) {
            if (!item1.boost && item2.boost)
                return 1;
            if (item1.boost && !item2.boost)
                return -1;
            if (item2.main > item1.main)
                return 1;
            if (item2.main < item1.main)
                return -1;
            return 0;
        });
        return matches;
    }

    normalize() {
        var normalized = new Array();
        for (var i = 0; i < this.dict.length; i++) {
            var tokens = this.dict[i][COL_TERM_ORIG].split(TERM_DELIM);
            for (var j = 0; j < tokens.length; j++) {
                if (!tokens[j] == "")
                    normalized.push({
                        main: tokens[0],
                        term: tokens[j],
                        term_norm: utils.normalizeArabic(utils.stripArabicDiacritics(tokens[j])),
                        def: this.dict[i][COL_DEF]
                    });
            }
        }
        this.dict = normalized;
    }

    sort() {
        this.dict.sort(function (item1, item2) {
            if (item2[COL_TERM] < item1[COL_TERM])
                return 1;
            if (item2[COL_TERM] > item1[COL_TERM])
                return -1;
            return 0;
        });
    }

}

module.exports = Dictionary;