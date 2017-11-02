import { EventEmitter } from 'events';
import * as constants from './eventConstants';
import { deleteMessageFromQueue } from './mongoDB';

let emitter = null;

let userAuthenticateListener = (conn) => {
    console.log('userAuthenticate Listener');
    conn.write('userAuthenticate');
}

let userAuthenticatedListener = (conn) => {
    console.log('userAuthenticated Listener');
    conn.write('userAuthenticated');
}

let notificationReceivedAckListener = ({conn, messageId}) => {
    console.log('notificationReceivedAck Listener');
    deleteMessageFromQueue(messageId)
    .then((message) => {
        conn.write(JSON.stringify({event: 'server', payload: {message: `notification deleted ${messageId}`}}));
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
    emitter.addListener(constants.INVALID_JSON, invalidJsonListener);
    emitter.addListener(constants.AUTH_ERROR, authErrorListener);
}

export {emitter, registerListeners};