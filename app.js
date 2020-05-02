"use strict";
const bodyParser = require("body-parser");
const express = require('express');
const hbs = require('hbs');
const Matcher = require('./lib/Matcher');
const Notifier = require('./lib/Notifier');
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

app.get('/update', function (req, res) {
    return processUpdate(req, res);
});

app.get('/delete', function (req, res) {
    return processDelete(req, res);
});

app.get('/refresh', function (req, res) {
    processRefresh(req, res);
    res.sendStatus(200);
    return;
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
                    var def = Matcher.match(token);
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
        for (var i = 0; i < Matcher.DICTS.length; i++) {
            var subresults = Matcher.DICTS[i].search(q);
            for (var j = 0; j < subresults.length; j++)
                utils.pushUniqueObject(results, "id", subresults[j].id, subresults[j]);
        }
    }
    res.render('search.hbs', {
        q: q,
        results: results
    });
}

async function processAdd(req, res) {
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
            if (pos == 'verb')
                Matcher.addVerb(pos, past, pres, def);
            else
                Matcher.addWord(pos, word, def);
        } catch (e) {
            Notifier.notifyOnError('Unable to add new word', e).catch(console.error);
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

function processUpdate(req, res) {
    var id = req.query.id;
    var terms0 = req.query.terms0.trim();
    var terms1 = req.query.terms1.trim();
    var def = req.query.def;
    try {
        Matcher.updateWord(id, terms0, terms1, def);
        res.status(200).send('ID ' + id + ' updated');
    } catch (e) {
        Notifier.notifyOnError('Unable to update word', e).catch(console.error);
        res.status(403).send(e);
    }
}

function processDelete(req, res) {
    var id = req.query.id;
    var terms0 = req.query.terms0.trim();
    var terms1 = req.query.terms1.trim();
    try {
        Matcher.deleteWord(id, terms0, terms1);
        res.status(200).send('ID ' + id + ' deleted');
    } catch (e) {
        Notifier.notifyOnError('Unable to delete word', e).catch(console.error);
        res.status(403).send(e);
    }
}

function processRefresh(req, res) {
    Matcher.refreshAllDicts();
}

hbs.registerHelper('islinefeed', function (value) {
    return (value == '\n');
});