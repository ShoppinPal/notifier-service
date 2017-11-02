import { INVALID_JSON } from './eventConstants';
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

export {isMessageValid, prepareMessage};