var express = require('express');
var router = express.Router();
import { sendMessageToBrowser } from '../firebase/FCM-messaging';
import { publishToRedis } from '../utils/publishToRedis';

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/sockJS/notify', (req, res, next) => {
  if(req.body && req.body.notification) {
    publishToRedis(req.body.notification)
    .then(() => {
      res.status(200).json({message: 'Notification submitted'});
    })
    .catch((error) => {
      res.status(500).json({message: 'Looks like we encountered redis related error', error: error});
    });
  }
});

router.post('/firebase/notify', (req, res, next) => {
  if(req.body && req.body.notification) {
    sendMessageToBrowser('', req.body.notification)
    .then((response) => {
      return res.status(200).json(response);
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
  }
});

module.exports = router;
