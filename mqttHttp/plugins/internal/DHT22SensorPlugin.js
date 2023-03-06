var resources = require('./../../resources/model');

var interval, sensor;
var mqttClient = null;
var model = resources.pi.sensors;
var pluginName = 'Temperature & Humidity';
var localParams = {'simulate': false, 'frequency': 30000};

exports.start = function (params, client) { //#A
  localParams = params;
  mqttClient = client;

  if (params.simulate) {
    simulate();
  } else {
    connectHardware();
  }
};

exports.stop = function () {
  if (!localParams.simulate) {
//    sensorDriver.unexport();
  }
  clearInterval(interval);
  console.info('%s plugin stopped!', pluginName);
};

exports.message = function (topic, message) {
  let newValue = parseFloat(message);
  if (topic === 'temperature') {
    if (model.temperature.value != newValue) {
      console.log("correcting published value for " + model.temperature.name);
      if (mqttClient != null) {
        mqttClient.publish(model.temperature.path, String(model.temperature.value));
      }
    }
  }
  else if (topic === 'humidity') {
    if (model.humidity.value != newValue) {
      console.log("correcting published value for " + model.humidity.name);
      if (mqttClient != null) {
        mqttClient.publish(model.humidity.path, String(model.humidity.value));
      }
    }
  }
};

function connectHardware() {
  var sensorDriver = require('node-dht-sensor');
  var sensor = {
    initialize: function () {
      return sensorDriver.initialize(22, model.temperature.gpio); //#A
    },
    read: function () {
      var readout = sensorDriver.read(); //#B
      model.temperature.value = parseFloat(readout.temperature.toFixed(2));
      model.humidity.value = parseFloat(readout.humidity.toFixed(2)); //#C
      showValue();
    }
  };
  if (sensor.initialize()) {
    console.info('Hardware %s sensor started!', pluginName);
    sensor.read();
    interval = setInterval(function () {
      sensor.read(); //#D
    }, localParams.frequency);
  } else {
    console.warn('Failed to initialize sensor!');
  }
};

function simulate() {
  interval = setInterval(function () {
    model.temperature.value = (model.temperature.value + 1)%4 + 24;
    model.humidity.value = (model.humidity.value + 1)%30 + 30;
    showValue();
  }, localParams.frequency);
  console.info('Simulated %s sensor started!', pluginName);
};

function showValue() {
  console.info('Temperature: %s C, humidity %s \%',
    model.temperature.value, model.humidity.value);
  if (mqttClient != null) {
    mqttClient.publish(model.temperature.path, String(model.temperature.value));
    mqttClient.publish(model.humidity.path, String(model.humidity.value));
  }
};

//#A Initialize the driver for DHT22 on GPIO 12 (as specified in the model)
//#B Fetch the values from the sensors
//#C Update the model with the new temperature and humidity values; note that all observers will be notified
//#D Because the driver doesn’t provide interrupts, you poll the sensors for new values on a regular basis with a regular timeout function and set sensor.read() as a callback
