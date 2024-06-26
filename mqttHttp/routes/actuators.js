var express = require('express'),
  router = express.Router(),
  resources = require('./../resources/model');

var badLED = {name: 'undefined LED'};
var badLCD = {name: 'undefined LCD line'};

router.route('/').get(function (req, res, next) {
  req.result = resources.pi.actuators;
  next();
});

router.route('/leds').get(function (req, res, next) {
  req.result = resources.pi.actuators.leds;
  next();
});

router.route('/leds/:id').get(function (req, res, next) { //#A
  req.result = resources.pi.actuators.leds[req.params.id];
  next();
}).put(function(req, res, next) { //#B
  var selectedLed = resources.pi.actuators.leds[req.params.id];
  if ((typeof selectedLed === 'object') && (selectedLed.hasOwnProperty('value'))) {
    if (typeof req.body.value === "boolean") {
      selectedLed.value = req.body.value; //#C
    }
    req.result = selectedLed;
  } else {
    req.result = badLED;
  }
  next();
}).post(function(req, res, next) { //#B
  var selectedLed = resources.pi.actuators.leds[req.params.id];
  if ((typeof selectedLed === 'object') && (selectedLed.hasOwnProperty('value'))) {
    if (typeof req.body.value === "boolean") {
      selectedLed.value = req.body.value; //#C
    }
    req.result = selectedLed;
  } else {
    req.result = badLED;
  }
  next();
});

router.route('/lcd').get(function (req, res, next) {
  req.result = resources.pi.actuators.lcd;
  next();
}).put(function(req, res, next) { //#B
//  var selectedLcd = resources.pi.actuators.lcd.message[req.params.line];
  if (typeof req.body.value === "string") {
    resources.pi.actuators.lcd.message['1'] = req.body.value.substr(0, 16); //#C
    if (req.body.value.length > 16) {
      resources.pi.actuators.lcd.message['2'] = req.body.value.substr(16, 16); //#C
    } else {
      resources.pi.actuators.lcd.message['2'] = " "; //#C
    }
  }
  req.result = resources.pi.actuators.lcd.message;
  next();
}).post(function(req, res, next) { //#B
//  var selectedLcd = resources.pi.actuators.lcd.message[req.params.line];
  if (typeof req.body.value === "string") {
    resources.pi.actuators.lcd.message['1'] = req.body.value.substr(0, 16); //#C
    if (req.body.value.length > 16) {
      resources.pi.actuators.lcd.message['2'] = req.body.value.substr(16, 16); //#C
    } else {
      resources.pi.actuators.lcd.message['2'] = " "; //#C
    }
  }
  req.result = resources.pi.actuators.lcd.message;
  next();
});

router.route('/lcd/:line').get(function (req, res, next) { //#A
  req.result = resources.pi.actuators.lcd.message[req.params.line];
  next();
}).put(function(req, res, next) { //#B
//  var selectedLcd = resources.pi.actuators.lcd.message[req.params.line];
  if (resources.pi.actuators.lcd.message.hasOwnProperty(req.params.line)) {
    if (typeof req.body.value === "string") {
      resources.pi.actuators.lcd.message[req.params.line] = req.body.value.substr(0, 16); //#C
    }
    req.result = resources.pi.actuators.lcd.message[req.params.line];
  } else {
    req.result = badLCD;
  }
  next();
}).post(function(req, res, next) { //#B
//  var selectedLcd = resources.pi.actuators.lcd.message[req.params.line];
  if (resources.pi.actuators.lcd.message.hasOwnProperty(req.params.line)) {
    if (typeof req.body.value === "string") {
      resources.pi.actuators.lcd.message[req.params.line] = req.body.value.substr(0, 16); //#C
    }
    req.result = resources.pi.actuators.lcd.message[req.params.line];
  } else {
    req.result = badLCD;
  }
  next();
});

module.exports = router;

//#A Callback for a GET request on an LED
//#B Callback for a PUT request on an LED
//#C Update the value of the selected LED in the model


/*
//Initial version:

var express = require('express'),
router = express.Router(),
resources = require('./../resources/model');

router.route('/').get(function (req, res, next) { // #A
 res.send(resources.pi.actuators); // #B
});

router.route('/leds').get(function (req, res, next) { // #C
  res.send(resources.pi.actuators.leds);
});

router.route('/leds/:id').get(function (req, res, next) { //#D
  res.send(resources.pi.actuators.leds[req.params.id]); //#E
});

module.exports = router;

//#A Create a new route for a GET request
//#B Reply with the actuators model when this route is selected
//#C This route serves a list of LEDs
//#D with :id we inject a variable in the path which will be the LED number
//#E the path variables are accessible via req.params.id we use this to select the right object in our model and return it
*/
