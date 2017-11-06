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

let deleteBulkMessagesFromQueue = (ids) => {
    return new Promise((resolve, reject) => {
        if (Array.isArray(ids)) {
            checkDatabaseObject(_db)
            .then((DB) => {
                let idsToDelete = [];
                ids.forEach((id) => {
                    idsToDelete.push(new ObjectID(id));
                });
                
                DB.collection('queue').deleteMany({_id: {$in: idsToDelete}}, (err, message) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(message);
                });
            })
            .catch((error) => {
                return reject(error);
            });
        }else {
            return reject('deleteBulkMessageFromQueue(ids): ids array invalid');
            console.log('deleteBulkMessageFromQueue(ids): ids array invalid');
        }
    });
}

let addNotifiedMessagesToHistory = (messageId) => {
    return new Promise((resolve, reject) => {
        checkDatabaseObject(_db)
        .then((DB) => {
            // (1) Find messages from messageId(s)
            let idsToMove = [];
            let query = {};
            if (Array.isArray(messageId)) {
                messageId.forEach((id) => {
                    idsToMove.push(new ObjectID(id));
                });
                query['_id'] = {};
                query['_id']['$in'] = idsToMove;
            }else {
                query = {_id: new ObjectID(messageId)};
            }
            DB.collection('queue').find(query)
            .toArray((err, messages) => {
                if (err) return reject(err);
                console.log('Moving to notifHistory', messages);
                // (2) Add them to notif history collection
                DB.collection('notifHistory').insertMany(messages, {upsert: true}, (err, result) => {
                    if (err) return reject(err);
                    return resolve('Notified messages add to history');
                });
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
    deleteMessageFromQueue, 
    addNotifiedMessagesToHistory,
    deleteBulkMessagesFromQueue, 
    disconnectDatabaseObject
};