import { EventEmitter } from 'events';
import * as constants from './eventConstants';
import { deleteMessageFromQueue, deleteBulkMessagesFromQueue, fetchMessagesForUser } from './mongoDB';

let emitter = null;

let userAuthenticateListener = (conn) => {
    console.log('userAuthenticate Listener');
    conn.write('userAuthenticate');
}

let userAuthenticatedListener = (conn) => {
    console.log('userAuthenticated Listener');
    conn.write(JSON.stringify({event: constants.USER_AUTHENTICATED, payload: {}}));
}

let fetchNotificationHistoryListener = ({conn, userId}) => {
    console.log('userAuthenticated Listener');
    fetchFromDBAndNotify(conn, userId); // fetch previous notifications from database that were not delivered due to client was not connected!
}

let notificationReceivedAckListener = ({conn, messageId}) => {
    console.log('notificationReceivedAck Listener');
    deleteMessageFromQueue(messageId)
    .then((message) => {
        conn.write(JSON.stringify({event: constants.MESSAGES_DELETED, payload: {message: `notification deleted from queue: ${messageId}`}}));
    })
    .catch((error) => {
        conn.write(JSON.stringify(error));
    });
}

let notificationBulkReceivedAckListener = ({conn, messageIds}) => {
    console.log('bulkNotificationReceivedAck Listener');
    deleteBulkMessagesFromQueue(messageIds)
    .then((message) => {
        conn.write(JSON.stringify({event: constants.BULK_MESSAGES_DELETED, payload: {message: `notification deleted from queue: ${messageIds}`}}));
    })
    .catch((error) => {
        conn.write(JSON.stringify(error));
    });
}

let invalidJsonListener = (conn) => {
    console.log('invalidJson Listener');
    conn.write('invalidJson');
}

let authErrorListener = (conn) => {
    console.log('authError Listener');
    conn.write('authError');
    conn.close();
}

let registerListeners = () => {
    if(emitter){
        return;
    }
    emitter = new EventEmitter();
    emitter.addListener(constants.USER_AUTHENTICATE, userAuthenticateListener);
    emitter.addListener(constants.USER_AUTHENTICATED, userAuthenticatedListener);
    emitter.addListener(constants.NOTIFICATION_RECEIVED_ACK, notificationReceivedAckListener);
    emitter.addListener(constants.NOTIFICATION_BULK_RECEIVED_ACK, notificationBulkReceivedAckListener);
    emitter.addListener(constants.USER_FETCH_NOTIFICATION_HISTORY, fetchNotificationHistoryListener);
    emitter.addListener(constants.INVALID_JSON, invalidJsonListener);
    emitter.addListener(constants.AUTH_ERROR, authErrorListener);
}

// load data from history and notify the clients that connected now!
let fetchFromDBAndNotify = (conn, userId) => {
    console.log('fetching from db...');
    return new Promise((resolve, reject) => {
        fetchMessagesForUser(userId)
        .then((messages) => {
            console.log(messages);
            if (Array.isArray(messages)) {
                let notif = { notifications: []};
                messages.forEach((message) => {
                    notif.notifications.push(message);
                });
                notif.event = notif.notifications.length > 0 ? constants.NOTIFICATION_HISTORY : constants.NOTIFICATION_HISTORY_EMPTY;
                conn.write(JSON.stringify(notif));
                return resolve();
            }else {
                console.log('MongoDB Error while fetching notifications for', userId);
            }
        })
        .catch((error) => {
            return reject(error); 
        });
    });
}

export {emitter, registerListeners};