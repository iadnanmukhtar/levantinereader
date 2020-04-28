"use strict";
const HOMEDIR = require('os').homedir();
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const STORE = JSON.parse(fs.readFileSync(HOMEDIR + '/.levantinereader.store.json'));

class DictionaryStore {

    static get(pos, callback) {
        const client = MongoClient(STORE.url, {
            useUnifiedTopology: true
        });
        client.connect(function (err) {
            if (err != null)
                throw err;
            const db = client.db(STORE.db);
            const collection = db.collection(STORE.collection.dict);
            collection.find({
                'pos': pos
            }).toArray(function (err, docs) {
                if (err != null)
                    throw err;
                client.close();
                callback(docs);
            });
        });
    }

    static add(word, callback) {
        const client = MongoClient(STORE.url, {
            useUnifiedTopology: true
        });
        client.connect(function (err) {
            const db = client.db(STORE.db);
            const collection = db.collection(STORE.collection.dict);
            collection.insertOne(word, function (err, result) {
                if (err != null)
                    throw err;
                client.close();
                callback(result);
            });
        });
    }

}

module.exports = DictionaryStore;