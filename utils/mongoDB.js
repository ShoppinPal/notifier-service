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

let fetchMessagesHistoryForUser = (userId) => {
    return new Promise((resolve, reject) => {
        checkDatabaseObject(_db)
        .then((DB) => {
            DB.collection('notifHistory').find({userId: userId}).toArray((err, messages) => {
                if (err) {
                    return reject(err);
                }
                return resolve(messages);
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

export {
    connectToMongoDB, 
    addMessageToDB, 
    fetchMessagesForUser, 
    disconnectDatabaseObject
};