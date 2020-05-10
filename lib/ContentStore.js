"use strict";
const HOMEDIR = require('os').homedir();
const fs = require('fs');
const utils = require('./utils');

const CONTENT_DIR = HOMEDIR + '/.levantinereader';

class ContentStore {

    static store(content) {
        const filename = utils.hashCode(content);
        if (!fs.existsSync(CONTENT_DIR))
            fs.mkdirSync(CONTENT_DIR);
        try {
            fs.writeFileSync(CONTENT_DIR + '/' + filename + '.txt', content);
        } catch (e) {
            console.error('Unable to store content: ' + e);
        }
        return filename;
    }

    static retrieve(filename) {
        const file = CONTENT_DIR + '/' + filename + '.txt';
        if (fs.existsSync(file))
            return fs.readFileSync(file).toString();
        return null;
    }

    static retrieveCollection(collectionname) {
        var dir = CONTENT_DIR + '/' + collectionname;
        if (fs.existsSync(dir))
            return JSON.parse(fs.readFileSync(dir + '/collection.json'));
        return null;
    }

    static retrieveArticle(collectionname, filename) {
        const file = CONTENT_DIR + '/' + collectionname + '/' + filename + '.txt';
        if (fs.existsSync(file))
            return fs.readFileSync(file).toString();
        return null;
    }

}

module.exports = ContentStore;