import { EventEmitter } from 'events';
import * as constants from './eventConstants';
import { addMessageIdToCache, deleteMessageIdFromCache, removeLoggedOutUserSocket } from './utility';
import { 
    deleteMessageFromQueue,
    addNotifiedMessagesToHistory,
    deleteBulkMessagesFromQueue, 
    fetchMessagesForUser 
} from './mongoDB';

let emitter = null;

let userAuthenticateListener = (conn) => {
    console.log('userAuthenticate Listener');
    conn.write('userAuthenticate');
}

let userAuthenticatedListener = (conn) => {
    console.log('userAuthenticated Listener');
    conn.write(JSON.stringify({event: constants.USER_AUTHENTICATED, payload: {}}));
}

let userLogoutListener = ({conn, userId}) => {
    console.log('userLogout Listener');
    removeLoggedOutUserSocket(userId, conn.id);
}

let fetchNotificationHistoryListener = ({conn, userId}) => {
    console.log('fetchNotificationHistory Listener');
    fetchFromDBAndNotify(conn, userId); // fetch previous notifications from database that were not delivered due to client was not connected!
}

let notificationReceivedAckListener = ({conn, messageId}) => {
    console.log('notificationReceivedAck Listener');
    // TODO: Refactor below code using async.series so that it is more readable!

    // Add messageId to cache if not already present.
    addMessageIdToCache(messageId)
    .then((response) => {
        if (response.state === constants.SKIP_DELETE_FROM_QUEUE) {
            // messageId already inside cache. It means it will be deleted from queue by previous request.
            console.log(response.message);
        }else if (response.state === constants.DELETE_FROM_QUEUE) {
            // messageId does not exist in cache
            console.log(response.message);
            // (1) Move notified messages to notifHistory collection from queue collection
            addNotifiedMessagesToHistory(messageId)
            .then((responseText) => {
                // (2) Delete message from mongodb queue collection
                console.log(responseText);
                deleteMessageFromQueue(messageId)
                .then((message) => {
                    // (3) Once messageId is deleted from queue, update cache to mark it for deletion.
                    deleteMessageIdFromCache(messageId)
                    .then((responseText) => {
                        console.log(responseText);
                    })
                    .catch((errorText) => {
                        console.log(errorText);
                    });
                    // (2.1) If messageId is deleted from queue notify client (this step is added to make testing easier, we can skip it on production)
                    conn.write(JSON.stringify({ event: constants.MESSAGES_DELETED, payload: { message: `notification deleted from queue: ${messageId}` } }));
                })
                .catch((error) => {
                    conn.write(JSON.stringify(error));
                });
            })
            .catch((error) => {
                console.log('Error moving notified message to notifHistory', error);
            });
        }
    })
    .catch((error) => {
        console.log('Could not add to messageIdCache', error);
    });
    
}
// No need to use cache here as only one socket will send ack for received messages (fetching history).
let notificationBulkReceivedAckListener = ({conn, messageIds}) => {
    console.log('bulkNotificationReceivedAck Listener');
    // TODO: Refactor below code using async.series so that it is more readable!
    addNotifiedMessagesToHistory(messageIds)
    .then((responseText) => {
        console.log(responseText);
        deleteBulkMessagesFromQueue(messageIds)
        .then((message) => {
            conn.write(JSON.stringify({event: constants.BULK_MESSAGES_DELETED, payload: {message: `notification deleted from queue: ${messageIds}`}}));
        })
        .catch((error) => {
            conn.write(JSON.stringify(error));
        });
    })
    .catch((error) => {
        console.log('Error moving notified messages to notifHistory', error);
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
    emitter.addListener(constants.USER_LOGOUT, userLogoutListener);
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