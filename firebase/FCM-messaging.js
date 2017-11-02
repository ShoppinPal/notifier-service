import * as admin from "firebase-admin";

let initFCM = () => {
    var serviceAccount = require("../secret/serviceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        //databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
      });
    
      // Retrieve Firebase Messaging object.
    const messaging = admin.messaging();
    
}

let sendMessageToBrowser = (registrationToken, payload) => {
    // Send a message to the device corresponding to the provided
    // registration token.
    return new Promise((resolve, reject) => {
        admin.messaging().sendToDevice(registrationToken, payload)
        .then(function(response) {
            // See the MessagingDevicesResponse reference documentation for
            // the contents of response.
            console.log("Successfully sent message:", response);
            return resolve({message: 'Successfully sent message', response: response});
        })
        .catch(function(error) {
            console.log("Error sending message:", error);
            return reject(error);
        });
    });
    
}


export { initFCM, sendMessageToBrowser };