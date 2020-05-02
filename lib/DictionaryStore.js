"use strict";
const HOMEDIR = require('os').homedir();
const fs = require('fs');
const mongodb = require('mongodb');

const STORE = JSON.parse(fs.readFileSync(HOMEDIR + '/.levantinereader.store.json'));

class DictionaryStore {

    static get(pos, callback) {
        const client = mongodb.MongoClient(STORE.url, {
            useUnifiedTopology: true
        });
        client.connect(async function (err) {
            if (err != null)
                throw err;
            const db = client.db(STORE.db);
            const collection = db.collection(STORE.collection.dict);
            await collection.find({
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
        word.modified = new mongodb.Timestamp();
        const client = mongodb.MongoClient(STORE.url, {
            useUnifiedTopology: true
        });
        client.connect(async function (err) {
            const db = client.db(STORE.db);
            const collection = db.collection(STORE.collection.dict);
            await collection.insertOne(word, function (err, result) {
                if (err != null)
                    throw err;
                client.close();
                callback(result);
            });
        });
    }

    static async update(id, word, callback) {
        const client = mongodb.MongoClient(STORE.url, {
            useUnifiedTopology: true
        });
        client.connect(async function (err) {
            const db = client.db(STORE.db);
            const collection = db.collection(STORE.collection.dict);
            var _id = {
                _id: mongodb.ObjectID(id)
            };
            var _word = {
                $currentDate: {
                    modified: {
                        $type: 'timestamp'
                    }
                },
                $set: word
            };
            await collection.updateOne(_id, _word, function (err, result) {
                if (err != null)
                    throw err;
                client.close();
                callback(result);
            });
        });
    }

}

module.exports = DictionaryStore;