const bodyParser = require("body-parser");
const express = require('express');
const hbs = require('hbs');
const definer = require('./lib/definer');

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

function process(req, res, content) {
    var defs = {};
    if (content !== undefined) {
        defs = new Array();
        var tokens = content.split(DELIMS);
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token != "") {
                if (!token.match(DELIMS)) {
                    var word = definer.define(token);
                    defs.push(word);
                } else {
                    defs.push({
                        word: token,
                        delim: true,
                        error: false
                    });
                }
            }
        }
    }
    res.render('index', {
        'content': content,
        'words': defs
    });
}

String.prototype.hexEncode = function () {
    var hex, i;
    var result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }

    return result
}

hbs.registerHelper('islinefeed', function (value) {
    var hex = value.hexEncode();
    var result = (value == '\n');
    return result;
});