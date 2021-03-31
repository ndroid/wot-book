var resources = require('./../../resources/model');
var exec = require('child_process').exec;

var actuator = {};
var interval;
var model = resources.pi.actuators.leds;
var pluginName = 'LEDs';  //model.name;
var localParams = {'simulate': false, 'frequency': 2000};

exports.start = function (params) {
  localParams = params;
  observe(model); //#A

  if (localParams.simulate) {
    simulate();
  } else {
    connectHardware();
  }
};

exports.stop = function () {
  if (localParams.simulate) {
    clearInterval(interval);
  } else {
    for (var gpio in actuator) {
      actuator[gpio].unexport();
    }
  }
  console.info('%s plugin stopped!', pluginName);
};

function observe(what) {
  console.info('initial led value ' + model);
  for(var ledKey in model) {
    let objectRef = model[ledKey];
    model[ledKey] = new Proxy(objectRef, {
      set: function(obj, prop, value) {
        if (prop == 'value') {
          console.info('Change detected by plugin for %s...', pluginName);
          switchOnOff(obj.gpio, value); //#B
        }
        obj[prop] = value;
        return true;
        }});
  }
  console.info('final led value ' + model);
};

function switchOnOff(gpio, value) {
  if (!localParams.simulate) {
    actuator[gpio].write(value === true ? 1 : 0, function () { //#C
      console.info('Changed value of %s to %s', pluginName, value);
      exec("fswebcam -r 1280x720 --save ./public/camera/image.jpg", function(err, stdout, stderr) {
          if (err) {
            console.error(err);
          }
          console.info('image captured');
        });
    });
  }
};

function connectHardware() {
  var Gpio = require('onoff').Gpio;
  for(var ledKey in model) {
    actuator[model[ledKey].gpio] = new Gpio(model[ledKey].gpio, 'out'); //#D
    console.info('Hardware %s actuator started for %s', pluginName, model[ledKey].name);
  }
};

function simulate() {
  interval = setInterval(function () {
    // Switch value on a regular basis
    if (model.value) {
      model.value = false;
    } else {
      model.value = true;
    }
  }, localParams.frequency);
  console.info('Simulated %s actuator started!', pluginName);
};

//#A Observe the model for the LEDs
//#B Listen for model changes, on changes call switchOnOff
//#C Change the LED state by changing the GPIO state
//#D Connect the GPIO in write (output) mode

