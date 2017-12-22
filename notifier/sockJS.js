import sockjs from 'sockjs';
import http from 'http';
import { registerListeners } from './utils/eventListeners';
import { isAuthentic } from './utils/authenticate';
import messageHandlers from './utils/messageHandlers';
import {isMessageValid, prepareMessage, clearMessageIdsCache} from './utils/utility';
import redis from 'redis';
import { connectToMongoDB, addMessageToDB } from './utils/mongoDB';

let subscriber = null;

// In memory data stores
let users = {};
let connections = {};
let connectionToUserMapping = {};
let messageIdsCache = {};

// handle redis subscription for different channels! Connect to redis subscribe channel.
// Below code works when warehouse worker notifies certain event to notifier service.
let handleSubscription  = (users) => {
    if (!subscriber) {
        subscriber = redis.createClient({ host: 'redis', port: 6379 });
        subscriber.subscribe('notification', (err) => {
            if (err){
                console.log(err);
                process.exit(1);
                return;
            }
        });
        console.log('Subscribed to notification channel');
    }
    subscriber.on('message', (channel, message) => {
    
        switch (channel) {
            case 'notification':
                sendNotificationToBrowser(message);
            break;

            default:
                console.log('Unknown channel', channel);
            break;
        }
    });
}

let cleanupOnDisconnect = (socketId) => {
    delete connections[socketId]; // clean up connections object!
    let userId = connectionToUserMapping[socketId];
    if (users[userId] && Array.isArray(users[userId])) {
        let index = users[userId].indexOf(socketId);

        if (index >= 0) {
            users[userId].splice(index, 1);
        }
    }
    delete connectionToUserMapping[socketId];
    console.log('Clearing objects on disconnect........\n\n');
    console.log('connections:', connections);
    console.log('users:', users);
    console.log(connectionToUserMapping);
    console.log('\n\n');
    // todo: cleanup users object! Maybe introduce one connectionsUsersMapping object!
}

let sendNotificationToBrowser = (message) => {
    let notif = prepareMessage(message, 'worker');
    //console.log('notification', notif);
    if (isMessageValid(notif)) { 
        if(users[notif.userId]) { // If active connection for notif.userId exists, send notification!
            let socketIds = users[notif.userId];
            addMessageToDB(notif).then(() => {
                socketIds.forEach((socketId) => {
                    if (connections[socketId]) {
                        connections[socketId].write(JSON.stringify(notif));
                        console.log('Notification sent to client');
                    }
                });
            })
            .catch((error) => {
                console.log('Error occured while inserting into mongodb', error);
            });
        }else {
            addMessageToDB(notif)
            .then(() => {
                console.log('Client was not available so message queued into database');
            })
            .catch((error) => {
                console.log('Error occured while inserting into mongodb', error);
            });
        }                 
    }else {
        console.log('Invalid notification format or userId not found!');
    }
}

/**
 * SockJS server implementation....
 */
var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });
console.log('hello I am working');
connectToMongoDB();
handleSubscription(users);  // setup redis subscriber for 'notification' channel!
echo.on('connection', function(conn) {
    isAuthentic(conn.url)
    .then(() => {
        connections[conn.id] = conn;

        conn.on('data', function(message) {
            //conn.write(message);
            //console.log(conn.id);
            //console.log(users);
            console.log('Cache', messageIdsCache);
            messageHandlers(conn, connectionToUserMapping, message, users);
        });
        conn.on('close', function() {
            cleanupOnDisconnect(conn.id);
            console.log('connection closed');
            /**
             * Todo: Remove disconnected clients from queue or storage
             */
        });
    })
    .catch(() => {
        conn.close();
    });
});

var server2 = http.createServer();

registerListeners();
echo.installHandlers(server2, {prefix:'/echo'});

server2.listen(4000);
// Periodically (every 5min) clear messageId cache
clearMessageIdsCache();

export {connections, users, messageIdsCache};