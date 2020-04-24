const Dictionary = require('../lib/Dictionary');
const definer = require('../lib/definer');

var word = 'تقافات';

// const list = new Dictionary('X', 'levantine.arabic.words.tsv');
// var partials = new Array();
// definer.trimPrefixes(partials, word);
// definer.trimSuffixes(partials, word);
// console.log(list.findAll(partials));

console.log(definer.define(word));

var partials = new Array();
definer.trimPrefixes(partials, word);
definer.trimSuffixes(partials, word);
console.log(partials);