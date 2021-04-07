var resources = require('./../../resources/model');
var exec = require('child_process').exec;

var interval, lcd;
var mqttClient = null;
var model = resources.pi.actuators.lcd;
var pluginName = resources.pi.actuators.lcd.name;
var localParams = {'simulate': false, 'frequency': 300000};
var printQueue = {'processing': false, 'queue': []};

exports.start = function (params, client) { //#A
  localParams = params;
  mqttClient = client;
  
  if (!localParams.simulate) {
    connectHardware();
  }
  
  interval = setInterval(function () {
    if (mqttClient != null) {
      for(let line in model.message) {
        mqttClient.publish(model.path + '/' + line, model.message[line]);
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

exports.message = function (line, message) {
  console.info('initial message value ' + model.message);
  let msgString = String(message);
  if (line === null) {
    if (typeof msgString === "string") {
      if (mqttClient != null) {
        mqttClient.publish(model.path + '/1', msgString.substr(0, 16));
        if (msgString.length > 16) {
          mqttClient.publish(model.path + '/2', msgString.substr(16, 16));
        } else {
          mqttClient.publish(model.path + '/2', " ");
        }
      }
    }
  }
  else if (line == '1') {
    if (typeof msgString === "string") {
      model.message['1'] = msgString.substr(0, 16); //#C
      printline(0, model.message['1']);
//      if (mqttClient != null) {
//        mqttClient.publish(model.path + '/1', model.message['1']);
//      }
    }
  }
  else if (line == '2') {
    if (typeof msgString === "string") {
      model.message['2'] = msgString.substr(0, 16); //#C
      printline(1, model.message['2']);
//      if (mqttClient != null) {
//        mqttClient.publish(model.path + '/2', model.message['2']);
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
      mqttClient.publish(model.path + '/1', model.message['1']);
    }
    printline(1, model.message['2']);
    if (mqttClient != null) {
      mqttClient.publish(model.path + '/2', model.message['2']);
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


