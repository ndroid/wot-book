var resources = require('./../../resources/model');
var exec = require('child_process').exec;

var actuator = {};
var interval;
var mqttClient = null;
var model = resources.pi.actuators.leds;
var pluginName = 'LEDs';  //model.name;
var localParams = {'simulate': false, 'frequency': 21600000}; // every 6 hours

exports.start = function (params, client) {
  localParams = params;
  mqttClient = client;
  observe(model);

  if (!localParams.simulate) {
    connectHardware();
  }
  
  interval = setInterval(function () {
    if (mqttClient != null) {
      for(let ledKey in model) {
//        if (model[ledKey].hasOwnProperty('topic')) {
        if ((typeof model[ledKey] === 'object') && (model[ledKey].hasOwnProperty('topic'))) {
          mqttClient.publish(model[ledKey].path, String(model[ledKey].value), {retain: true});
        }
      }
    }
  }, localParams.frequency);
};

exports.stop = function () {
  if (!localParams.simulate) {
    for (let leds in actuator) {
      actuator[leds].writeSync(0); //#G
      actuator[leds].unexport();
    }
  }
  clearInterval(interval);
  console.info('%s plugin stopped!', pluginName);
};

function observe(what) {
  console.info('initial led value ' + model);
  for(let ledKey in model) {
    if ((typeof model[ledKey] === 'object') && (model[ledKey].hasOwnProperty('topic'))) {
      let objectRef = model[ledKey];
      model[ledKey] = new Proxy(objectRef, {
        set: function(obj, prop, value) {
          if (prop == 'value') {
//            let oldValue = obj.value;
            console.info('-LED- initial ' + obj.topic + ' led value ' + obj.value + ', set to ' + value);
            switchOnOff(obj.topic, value); //#B
            if ((mqttClient != null) && (obj.value !== value)) {
              console.log("publish to " + obj.path + " value: " + String(value));
              mqttClient.publish(obj.path, String(value), {retain: true});
            }
          }
          obj[prop] = value;
          return true;
          }});
    }
  }
  console.info('final led value ' + model);
};

exports.message = function (color, message) {
  if ((typeof model[color] === 'object') && (model[color].hasOwnProperty('topic'))) {
    let newValue = model[color].value;
    console.info('-LED- initial ' + color + ' led value ' + newValue + ', set to ' + message);
    if ( (message == 'true') || (message == 'on') || (message == '1') ) {
      newValue = true;
    }
    else if ( (message == 'false') || (message == 'off') || (message == '0') ) {
      newValue = false;
    }
    else {
      if (mqttClient != null) {
        mqttClient.publish(model[color].path, String(newValue), {retain: true});
        console.log("publish to " + model[color].path + " value: " + String(newValue));
      }
    }
    if (newValue !== model[color].value) {
      model[color].value = newValue;
//      switchOnOff(color, newValue);
    }
  }
};

function switchOnOff(color, value) {
  if (!localParams.simulate) {
    actuator[color].write(value === true ? 1 : 0, function () { //#C
      console.info('Changed value of %s LED to %s', color, value);
      exec("fswebcam -r 1280x720 --save ./public/camera/image.jpg", function(err, stdout, stderr) {
          if (err) {
            console.error(err);
          }
          console.info(' ----image captured');
        });
    });
  }
};

function connectHardware() {
  var Gpio = require('onoff').Gpio;
  for(let ledKey in model) {
    if ((typeof model[ledKey] === 'object') && (model[ledKey].hasOwnProperty('topic'))) {
      actuator[model[ledKey].topic] = new Gpio(model[ledKey].gpio, 'out'); //#D
      console.info('Hardware %s actuator started for %s', pluginName, model[ledKey].name);
      let ledColor = String(ledKey);
      actuator[model[ledColor].topic].write(model[ledColor].value === true ? 1 : 0, function () { //#E
        if (mqttClient != null) {
          mqttClient.publish(model[ledColor].path, String(model[ledColor].value), {retain: true});
        }
        console.log("Set " + model[ledColor].name + " state to: " + model[ledColor].value);
      });
    }
  }
};


//#A Observe the model for the LEDs
//#B Listen for model changes, on changes call switchOnOff
//#C Change the LED state by changing the GPIO state
//#D Connect the GPIO in write (output) mode

