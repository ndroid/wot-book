var resources = require('./../../resources/model');
var exec = require('child_process').exec;

var interval, lcd;
var mqttClient = null;
var model = resources.pi.actuators.lcd;
var pluginName = resources.pi.actuators.lcd.name;
var localParams = {'simulate': false, 'frequency': 21600000}; // every 6 hours
var printQueue = {'processing': false, 'queue': []};

exports.start = function (params, client) { //#A
  localParams = params;
  mqttClient = client;
  observe(model);
  
  if (!localParams.simulate) {
    connectHardware();
  }
  
  interval = setInterval(function () {
    if (mqttClient != null) {
      for(let line in model.message) {
        mqttClient.publish(model.path + '/' + line, model.message[line], {retain: true});
      }
    }
  }, localParams.frequency);
};

exports.stop = function () { //#A
  if (!localParams.simulate) {
    lcd.close();
  }
  clearInterval(interval);
  console.info('%s plugin stopped!', pluginName);
};

function observe(what) {
  console.info('initial message value ' + model.message);
  let objRef = model.message;
  model.message = new Proxy(objRef, {
    set: function(obj, prop, value) {
      if (prop == '1') {
        console.info('Change detected by LCD plugin for line 1 ...');
        printline(0, value);
        if ((mqttClient != null) && (obj[prop] !== value)) {
          console.log("publish to " + model.path + "/1 value: " + String(value));
          mqttClient.publish(model.path + '/1', String(value), {retain: true});
        }
        obj[prop] = value;
        return true;
      }
      if (prop == '2') {
        console.info('Change detected by LCD plugin for line 2 ...');
        printline(1, value);
        if ((mqttClient != null) && (obj[prop] !== value)) {
          console.log("publish to " + model.path + "/2 value: " + String(value));
          mqttClient.publish(model.path + '/2', String(value), {retain: true});
        }
        obj[prop] = value;
        return true;
      }
      console.info('Bad LCD write ... for property: ' + prop + '  with value: ' + value);
      return false;
    }});
  console.info('final message value ' + model.message);
};

exports.message = function (line, message) {
  console.info('initial message value ' + model.message);
  let msgString = String(message);
  if (line === null) {
    if (typeof msgString === "string") {
      if (mqttClient != null) {
        mqttClient.publish(model.path + '/1', msgString.substr(0, 16), {retain: true});
        if (msgString.length > 16) {
          mqttClient.publish(model.path + '/2', msgString.substr(16, 16), {retain: true});
        } else {
          mqttClient.publish(model.path + '/2', " ", {retain: true});
        }
      }
    }
  }
  else if (line == '1') {
    if (typeof msgString === "string") {
      model.message['1'] = msgString.substr(0, 16); //#C
//      printline(0, model.message['1']);
//      if (mqttClient != null) {
//        mqttClient.publish(model.path + '/1', model.message['1'], {retain: true});
//      }
    }
  }
  else if (line == '2') {
    if (typeof msgString === "string") {
      model.message['2'] = msgString.substr(0, 16); //#C
//      printline(1, model.message['2']);
//      if (mqttClient != null) {
//        mqttClient.publish(model.path + '/2', model.message['2'], {retain: true});
//      }
    }
  }
  console.info('final message value ' + model.message);
};

function connectHardware() { //#B
  var Lcd = require("lcd");
  lcd = new Lcd(model.gpio); //#C

  lcd.on('ready', _ => {
    printline(0, model.message['1']);
    if (mqttClient != null) {
      mqttClient.publish(model.path + '/1', model.message['1'], {retain: true});
    }
    printline(1, model.message['2']);
    if (mqttClient != null) {
      mqttClient.publish(model.path + '/2', model.message['2'], {retain: true});
    }
  });
  console.info('Hardware %s actuator started!', pluginName);
};

function completeJob() {
  printQueue.queue.shift();
  if (printQueue.queue.length === 0) {
    printQueue.processing = false;
    exec("fswebcam -r 1280x720 --save ./public/camera/image.jpg", function(err, stdout, stderr) {
        if (err) {
          console.error(err);
        }
        console.info('image captured');
      });
  }
  else {
    printQueue.queue[0](completeJob);
  }
};

function addJob(newJob) {
  printQueue.queue.push((cb) => {
    newJob(cb);
  });
  if (printQueue.processing === false) {
    printQueue.processing = true;
    printQueue.queue[0](completeJob);
  }
};

function printline(row, data) {
  if (!localParams.simulate) {
    addJob((cb) => {
      lcd.setCursor(0, row);
      console.info('  Printing to line ', row, ":  ", data);
      data += "                ".slice(data.lenth, 16);
      lcd.print(data, (err) => {
        if(err) {
          console.error(err);
        }
        setImmediate( () => {
          cb();
        });
      });
    });
  }
};


//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pins to which the LCD is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.


