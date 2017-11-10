import { INVALID_JSON } from './eventConstants';
import * as constants from './eventConstants';
import { messageIdsCache, users } from '../sockJS';
/* Utility functions */

let isMessageValid = (message) => {
    if(message !== null 
        && typeof message === 'object' 
        && Object.keys(message).length > 0
        && message.hasOwnProperty('event') 
        && message.hasOwnProperty('payload')) {
            console.log('valid message', message);
            return true;
    }
    return false;
}

/* Prepare message to JSON object */
let prepareMessage = (message, source) => {
    try{
        return JSON.parse(message);
    }catch (e) {
        return {event: INVALID_JSON, source: source, payload: e};
    }
}

let addMessageIdToCache = (messageId) => {
    return new Promise((resolve, reject) => {
        if (!messageId) return reject(`Invalid messageId: ${messageId}`);

        if (messageIdsCache[messageId]) {
            // If messageId already in cache: Back off and don't proceed to make a DB call to delete it from mongodb Queue.
            return resolve({state: constants.SKIP_DELETE_FROM_QUEUE, message:'messageId cache hit, skip mongo call'});
        }else {
            // add this messageId to cache so that subsequent message ack do not make mongodb calls.
            // Proceed and make a mongodb call to delete message with given messageId in the next step. 
            messageIdsCache[messageId] = {state: constants.STATE_DELETING, time: Date()};
            return resolve({state: constants.DELETE_FROM_QUEUE, message: 'messageId added to cache, calling mongo to delete it in next step'});
        }
    });
}

let deleteMessageIdFromCache = (messageId) => {
    return new Promise((resolve, reject) => {
        if (!messageId) return reject(`Invalid messageId: ${messageId}`);

        if (messageIdsCache[messageId]) {
            messageIdsCache[messageId] = {state: constants.STATE_DELETED, time: Date()};
            return resolve(`${messageId} marked for deletion in cache`);
        }
    });
}

let removeLoggedOutUserSocket = (userId, socketId) => {
    if (users[userId]) {
        let index = users[userId].indexOf(socketId);
        if (index >= 0) {
            users[userId].splice(index, 1);
        }
        console.log('Logged out user socket id removed');
    }
}

let clearMessageIdsCache = () => {
    let timerId = setInterval(() => {
        Object.keys(messageIdsCache).forEach((messageId) => {
            if (messageIdsCache[messageId].state && 
                messageIdsCache[messageId].state === constants.STATE_DELETED) {
                    delete messageIdsCache[messageId];
            }
        });
        console.log('\n\n############ messageIdsCache cleaned up ##############\n\n', messageIdsCache);
    }, 1000 * 60 * 5);
}

export {
    isMessageValid, 
    prepareMessage, 
    addMessageIdToCache, 
    deleteMessageIdFromCache, 
    removeLoggedOutUserSocket,
    clearMessageIdsCache
};