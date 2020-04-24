const bodyParser = require("body-parser");
const express = require('express');
const hbs = require('hbs');
const definer = require('./lib/definer');
const utils = require('./lib/utils');

var app = express();
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use('/assets', express.static('assets'));
app.listen(3000);

const DELIMS = /([^\u0621-\u0653])/g;

app.post('/', function (req, res) {
    return process(req, res, req.body.content);
});

app.get('/', function (req, res) {
    return process(req, res, req.query.content);
});

app.get('/search', function (req, res) {
    return processSearch(req, res, req.query.q);
});

function process(req, res, content) {
    var defs = {};
    if (content !== undefined) {
        defs = new Array();
        var tokens = content.split(DELIMS);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token !== "") {
                if (!token.match(DELIMS)) {
                    var def = definer.define(token);
                    defs.push(def);
                } else {
                    defs.push({
                        word: token,
                        match: true,
                        exactMatch: true,
                        delim: true
                    });
                }
            }
        }
    }
    res.render('index', {
        content: content,
        words: defs
    });
}

function processSearch(req, res, q) {
    var results = new Array();
    if (q && q != "" && !q.match(/^\s$/) && q.length > 2) {
        q = utils.normalizeArabic(utils.stripArabicDiacritics(q));
        for (var i = 0; i < definer.DICTS.length; i++) {
            results = results.concat(definer.DICTS[i].search(q));
        }
    }
    res.render('search.hbs', {
        q: q,
        results: results
    });
}

hbs.registerHelper('islinefeed', function (value) {
    return (value == '\n');
});