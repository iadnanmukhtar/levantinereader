"use strict";
const HOMEDIR = require('os').homedir();
const fs = require('fs');
const utils = require('./utils');

const LOG_DIR = HOMEDIR + '/.levantinereader.log';

class ContentStore {

    static store(content) {
        const filename = utils.hashCode(content);
        if (!fs.existsSync(LOG_DIR))
            fs.mkdirSync(LOG_DIR);
        try {
            fs.writeFileSync(LOG_DIR + '/' + filename + '.txt', content);
        } catch (e) {
            console.error('Unable to store content: ' + e);
        }
        return filename;
    }

    static retrieve(filename) {
        const file = LOG_DIR + '/' + filename + '.txt';
        if (fs.existsSync(file))
            return fs.readFileSync(file).toString();
        return null;
    }

}

module.exports = ContentStore;