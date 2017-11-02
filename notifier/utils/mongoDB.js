import { MongoClient, ObjectID } from 'mongodb';
import assert from 'assert';

let _db = null;

let connectToMongoDB = () => {
    MongoClient.connect('mongodb://mongoDB:27017/notifications', function(err, db) {
        assert.equal(null, err);
        _db = db;
        console.log("Connected successfully to mongodb server");
    });
}

let addMessageToDB = (message) => {
    return new Promise((resolve, reject) => {
        checkDatabaseObject(_db)
        .then((DB) => {
            DB.collection('queue').insertOne(message, (err, result) => {
                if (err) {
                    return reject(err);
                }
                console.log('Added to db', message._id);
                return resolve(result);
            });
        })
        .catch((error) => {
            return reject(error);
        });
    });
}

let fetchMessagesForUser = (userId) => {
    return new Promise((resolve, reject) => {
        checkDatabaseObject(_db)
        .then((DB) => {
            DB.collection('queue').find({userId: userId}).toArray((err, messages) => {
                if (err) {
                    return reject(err);
                }
                console.log('returned messages', typeof messages);
                return resolve(messages);
            });
        })
        .catch((error) => {
            return reject(error);
        });
    });
}

let deleteMessageFromQueue = (id) => {
    return new Promise((resolve, reject) => {
        checkDatabaseObject(_db)
        .then((DB) => {
            DB.collection('queue').deleteOne({_id: new ObjectID(id)}, (err, message) => {
                if (err) {
                    return reject(err);
                }
                return resolve(message);
            });
        })
        .catch((error) => {
            return reject(error);
        });
    });
}

let disconnectDatabaseObject = (_db) => {
    checkDatabaseObject(_db)
    .then((DB) => {
        DB.close();
    })
    .catch((error) => {
        return reject(error);
    });
}

let checkDatabaseObject = (_db) => {
    return new Promise((resolve, reject) => {
        if (_db) {
            return resolve(_db);
        }else {
            return reject({error: {message: 'Mongodb object is not initialized or connection was not established', db: _db}});
        }
    })
}

export {connectToMongoDB, addMessageToDB, fetchMessagesForUser, deleteMessageFromQueue, disconnectDatabaseObject};