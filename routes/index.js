var express = require('express');
var router = express.Router();
var path    = require("path");

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  res.sendFile(path.join('/public/index.html'));
});

router.get('/2', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  res.sendFile(path.join('/public/index2.html'));
});

module.exports = router;
