import { EventEmitter } from 'events';
import {emitter} from './eventListeners';
import * as constants from './eventConstants';
import {isAuthentic} from './authenticate';
import {isMessageValid, prepareMessage} from './utility';
import { fetchMessagesForUser } from './mongoDB';

//let emitter = null;
/*
    @param:conn - socket connection
*/

let messageHandlers = (conn, message, users) => {
    //registerListeners();    // Todo: Move to separate file!
    let messageObject = prepareMessage(message, 'client'); // second argument says message obtained from client
    if(isMessageValid(messageObject)) {
  
        switch (messageObject.event) {
            case constants.USER_AUTHENTICATE:
                let { userId } = messageObject;
                if (isAuthentic(userId)) {
                    emitter.emit(constants.USER_AUTHENTICATED, conn);
                    users[userId] = conn.id;
                    fetchFromDBAndNotify(conn, userId); // fetch previous notifications from database that were not delivered due to client was not connected!
                    console.log(users);
                }
                else {
                    emitter.emit(constants.AUTH_ERROR, conn);
                }
            break;

            case constants.USER_AUTHENTICATED:
                emitter.emit(constants.USER_AUTHENTICATED, conn);
            break;

            case constants.NOTIFICATION_RECEIVED_ACK:
                let messageId = messageObject.messageId;
                emitter.emit(constants.NOTIFICATION_RECEIVED_ACK, { conn, messageId });
            break;

            case constants.INVALID_JSON:
                emitter.emit(constants.INVALID_JSON, conn);
            break;

            case constants.AUTH_ERROR: 
                emitter.emit(constants.AUTH_ERROR, conn);
            break;

            default:
                console.log('default case', messageObject);
            break;
        }
        
    }else{
        console.log('Invalid message', messageObject);
    }
}

// let addToUsersList = (users, userId, socket) => {
//     if (users[userId]) {
//         users[userId].push(socket);
//     }else {
//         users[userId] = [];
//         users[userId].push(socket);
//     }
//     console.log('Total users', users);
// }
// load data from history and notify the clients that connected now!
let fetchFromDBAndNotify = (conn, userId) => {
    console.log('fetching from db...');
    return new Promise((resolve, reject) => {
        fetchMessagesForUser(userId)
        .then((messages) => {
            console.log(messages);
            // todo: improvement for sending it as a bulk notificaton!
            if (Array.isArray(messages)) {
                messages.forEach((message) => {
                    conn.write(JSON.stringify(message));
                });
                return resolve();
            }
        })
        .catch((error) => {
            return reject(error); 
        });
    });
}

export default messageHandlers;