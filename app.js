"use strict";
const bodyParser = require("body-parser");
const express = require('express');
const hbs = require('hbs');
const definer = require('./lib/definer');
const DictionaryStore = require('./lib/DictionaryStore');
const utils = require('./lib/utils');

var app = express();
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use('/assets', express.static('assets'));
app.use('/', express.static('assets'));
app.listen(3000);

const DELIMS = /([^\u0621-\u0653])/g;
const ARABIC = /^([\u0621-\u0653 ،,/\\\;:\-]+$)/g;

app.post('/', function (req, res) {
    return process(req, res, req.body.content);
});

app.get('/', function (req, res) {
    return process(req, res, req.query.content);
});

app.get('/search', function (req, res) {
    return processSearch(req, res, req.query.q);
});

app.get('/add', function (req, res) {
    return processAdd(req, res);
});

function process(req, res, content) {
    var defs = {};
    if (content) {
        content = utils.fixContent(content);
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
    if (q && q != "" && !q.match(/^\s$/) && q.length > 1) {
        q = utils.normalizeArabic(utils.stripArabicDiacritics(q.toLowerCase()));
        for (var i = 0; i < definer.DICTS.length; i++) {
            results = results.concat(definer.DICTS[i].search(q));
        }
    }
    res.render('search.hbs', {
        q: q,
        results: results
    });
}

function processAdd(req, res) {
    var errors = new Array();
    var pos = req.query.pos;
    var word = req.query.word;
    var past = req.query.past;
    var pres = req.query.pres;
    var def = req.query.def;
    if (!pos || pos.trim() == '')
        errors.push("Part of Speech cannot be blank");
    if (pos && !pos.match(/^(stop|verb|word)$/))
        errors.push("Invalid part of speech");
    if (pos && pos == 'verb') {
        if (!past || past.trim() == '')
            errors.push("Past tense cannot be blank");
        if (!pres || pres.trim() == '')
            errors.push("Present tense cannot be blank");
        if (past && !past.match(ARABIC))
            errors.push("Past tense must in Arabic");
        if (pres && !pres.match(ARABIC))
            errors.push("Present tense must in Arabic");
        if (pres && !pres.startsWith('ي'))
            errors.push("Present tense must start with ي");
    } else {
        if (!word || word.trim() == '')
            errors.push("Word cannot be blank");
        if (word && !word.match(ARABIC))
            errors.push("Word must in Arabic");
    }
    if (!def || def.trim() == '')
        errors.push("Definition cannot be blank");

    if (errors.length == 0) {
        try {
            if (pos != 'verb')
                DictionaryStore.add({
                    pos: pos,
                    terms0: word,
                    terms1: '',
                    def: def
                }, function (result) {
                    utils.notifyOnNewWord(pos, word, def);
                });
            else
                DictionaryStore.add({
                    pos: pos,
                    terms0: past,
                    terms1: pres,
                    def: def
                }, function (result) {
                    utils.notifyOnNewWord(pos, past + "،" + pres, def);
                });
            definer.DICTS.forEach(function (dict) {
                dict.init();
            });
        } catch (e) {
            utils.notifyOnError('Unable to add new word', e).catch(console.error);
            errors.push(e);
        }
    }

    if (errors.length > 0) {
        res.render('search.hbs', {
            errors: errors
        });
    } else {
        if (pos == 'verb')
            word = past;
        res.render('search.hbs', {
            q: word,
            success: 'New word successfully added'
        });
    }
}

hbs.registerHelper('islinefeed', function (value) {
    return (value == '\n');
});