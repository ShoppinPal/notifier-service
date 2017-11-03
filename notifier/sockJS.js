import sockjs from 'sockjs';
import messageHandlers from './utils/messageHandlers';
import {isMessageValid, prepareMessage} from './utils/utility';
import redis from 'redis';
import { connectToMongoDB, addMessageToDB } from './utils/mongoDB';

let subscriber = null;

let users = {};
let connections = {};

let sockJS = {
    createSocketServer: (server) => {
        var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });
        console.log('hello I am working');
        connectToMongoDB();
        handleSubscription(users);  // setup redis subscriber for 'notification' channel!
        echo.on('connection', function(conn) {
            connections[conn.id] = conn;
            conn.on('data', function(message) {
                //conn.write(message);
                console.log(conn.id);
                //console.log(users);
                messageHandlers(conn, message, users);
            });
            conn.on('close', function() {
                cleanupOnDisconnect(conn.id);
                console.log('connection closed');
                /**
                 * Todo: Remove disconnected clients from queue or storage
                 */
            });
        });
        
        echo.installHandlers(server, {prefix:'/echo'});
    }
}

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
    console.log(connections);
    // todo: cleanup users object! Maybe introduce one connectionsUsersMapping object!
}

let sendNotificationToBrowser = (message) => {
    let notif = prepareMessage(message, 'worker');
    //console.log('notification', notif);
    if (isMessageValid(notif)) { 
        if(users[notif.userId]) { // If active connection for notif.userId exists, send notification!
            let socketId = users[notif.userId];
            addMessageToDB(notif).then(() => {
                connections[socketId].write(JSON.stringify(notif));
                console.log('Notification sent to browser');
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

export default sockJS;