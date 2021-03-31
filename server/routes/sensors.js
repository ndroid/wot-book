// Final version
var express = require('express'),
  router = express.Router(),
  resources = require('./../resources/model');
  
//var NodeWebCam = require('node-webcam');

//var opts = {
//  'width': 1280,
//  'height': 720,
//  'quality': 100,
//  'delay': 0,
//  'output': "jpg",
//  'device': false,
//  'callbackReturn': "base64",
//  'verbose': true
//};

//var FSWebcam = NodeWebCam.FSWebcam;
//var Webcam = new FSWebcam(opts);

router.route('/').get(function (req, res, next) {
  req.result = resources.pi.sensors; //#A
  next(); //#B
});

router.route('/pir').get(function (req, res, next) {
  req.result = resources.pi.sensors.pir;
  next();
});

router.route('/pir/value').get(function (req, res, next) {
  let valObj = {'value': 0};
  valObj.value = resources.pi.sensors.pir.value
  req.result = valObj;
  next();
});

//router.route('/camera').get(function (req, res, next) {
//  console.info('getting image');
//  Webcam.capture('~/server/my_pic.jpg', function (err, data) {
//    console.info('image captured: ', data);
//    var image = "<img src='" + data + "'>";
//    req.result = image;
//    next();
//  });
//});

router.route('/temperature').get(function (req, res, next) {
  req.result = resources.pi.sensors.temperature;
  next();
});

router.route('/temperature/value').get(function (req, res, next) {
  let valObj = {'value': 0};
  valObj.value = resources.pi.sensors.temperature.value
  req.result = valObj;
  next();
});

router.route('/humidity').get(function (req, res, next) {
  req.result = resources.pi.sensors.humidity;
  next();
});

router.route('/humidity/value').get(function (req, res, next) {
  let valObj = {'value': 0};
  valObj.value = resources.pi.sensors.humidity.value
  req.result = valObj;
  next();
});

router.route('/camera').get(function (req, res, next) {
  req.result = resources.pi.sensors.camera;
  next();
});

router.route('/camera/picture').get(function (req, res, next) {
  let valObj = {'value': 0};
  valObj.value = resources.pi.sensors.camera.picture;
  req.result = valObj;
  next();
});


module.exports = router;

//#A Assign the results to a new property of the req object that you pass along from middleware to middleware
//#B Call the next middleware; the framework will ensure the next middleware gets access to req (including the req.result) and res



/*
// Initial version
var express = require('express'),
  router = express.Router(), //#A
  resources = require('./../resources/model');

router.route('/').get(function (req, res, next) { //#B
  res.send(resources.pi.sensors);  //#C
});

router.route('/pir').get(function (req, res, next) { //#D
  res.send(resources.pi.sensors.pir);
});

router.route('/temperature').get(function (req, res, next) { //#E
  res.send(resources.pi.sensors.temperature);
});

router.route('/humidity').get(function (req, res, next) { //#E
  res.send(resources.pi.sensors.humidity);
});

module.exports = router; //#F

//#A We require and instantiate an Express Router to define the path to our resources
//#B Create a new route for a GET request on all sensors and attach a callback function
//#C Reply with the sensor model when this route is selected
//#D This route serves the passive infrared sensor
//#E These routes serve the temperature and humidity sensor
//#F We export router to make it accessible for "requirers" of this file
*/
