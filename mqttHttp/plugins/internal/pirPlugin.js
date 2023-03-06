var resources = require('./../../resources/model');

const MOTIONDELAY = 60000;
const DEBOUNCE = 25;

var interval, sensor;
var presence = 0;
var mqttClient = null;
var model = resources.pi.sensors.pir;
var pluginName = resources.pi.sensors.pir.name;
var localParams = {'simulate': false, 'frequency': 30000};

exports.start = function (params, client) { //#A
  localParams = params;
  mqttClient = client;

  if (localParams.simulate) {
    simulate();
  } else {
    connectHardware();
  }
};

exports.stop = function () { //#A
  if (localParams.simulate) {
    clearInterval(interval);
  } else {
    clearTimeout(interval);
    sensor.unexport();
  }
  console.info('%s plugin stopped!', pluginName);
};

exports.message = function (message) {
  let newValue = model.value;
  if ( (message == 'true') || (message == '1') ) {
    newValue = 1;
  }
  else if ( (message == 'false') || (message == '0') ) {
    newValue = 0;
  }
  else {
    console.log("correcting published value for " + pluginName);
    showValue();
  }
  if (newValue !== model.value) {
    console.log("correcting published value for " + pluginName);
    showValue();
  }
};

function connectHardware() { //#B
  var Gpio = require('onoff').Gpio;
  sensor = new Gpio(model.gpio, 'in', 'both', {debounceTimeout: DEBOUNCE}); //#C
  sensor.watch(function (err, value) { //#D
    if (err) exit(err);
//    if (value) {
      if (model.value == 0) {
        model.value = 1;
        showValue();
      }
      clearTimeout(interval);
      interval = setTimeout(motionDetect, MOTIONDELAY);
//    }
  });
  console.info('Hardware %s sensor started!', pluginName);
  showValue();
};

function motionDetect() {
  model.value = 0;
  showValue();
}


function simulate() { //#E
  interval = setInterval(function () {
    model.value = !model.value;
    presence = !presence;
    showValue();
  }, localParams.frequency);
  console.info('Simulated %s sensor started!', pluginName);
};

function showValue() {
  console.info(model.value ? 'there is someone!' : 'not anymore!');
  if (mqttClient != null) {
    mqttClient.publish(model.path, String(model.value), {retain: true});
  }
};

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.


