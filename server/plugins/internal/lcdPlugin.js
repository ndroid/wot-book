var resources = require('./../../resources/model');
var exec = require('child_process').exec;

var interval, lcd;
var model = resources.pi.actuators.lcd;
var pluginName = resources.pi.actuators.lcd.name;
var localParams = {'simulate': false, 'frequency': 2000};
var printQueue = {'processing': false, 'queue': []};

exports.start = function (params) { //#A
  localParams = params;
  observe(model);
  
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
    lcd.close();
  }
  console.info('%s plugin stopped!', pluginName);
};

function observe(what) {
  console.info('initial message value ' + model.message);
  let objRef = model.message;
  model.message = new Proxy(objRef, {
    set: function(obj, prop, value) {
      if (prop == '1') {
        console.info('Change detected by plugin for %s...', pluginName);
        printline(0, value);
      }
      if (prop == '2') {
        console.info('Change detected by plugin for %s...', pluginName);
        printline(1, value);
      }
      obj[prop] = value;
      return true;
    }});
  console.info('final message value ' + model.message);
};

function connectHardware() { //#B
  var Lcd = require("lcd");
  lcd = new Lcd(model.gpio); //#C

  lcd.on('ready', _ => {
    printline(0, model.message['1']);
    printline(1, model.message['2']);
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
  addJob((cb) => {
    lcd.setCursor(0, row);
    console.info('  Printing to line ', row, ":  ", data);
    data += "                ".slice(data.lenth, 16);
    lcd.print(data, (err) => {
      if(err) {
        console.error(err);
      }
      cb();
    });
  });
};

function initDisplay() { 
  return new Promise((resolve, reject) => { 
    console.info('   LCD clearing display');
    lcd.clear((err) => {
      if(err) {
        reject();
      }
      resolve();
    });
  });
};

function setCursor(col, row) {
  return new Promise((resolve, reject) => { 
    console.info('   LCD moving cursor to row ', row);
    lcd.setCursor(col, row);
    resolve();
  });
};

function print(data) {
  return new Promise((resolve, reject) => {
    console.info('Message to LCD: ', data);
    lcd.print(data, (err) => {
      if(err) {
        reject();
      }
      resolve();
    });
  });
};

function simulate() { //#E
  interval = setInterval(function () {
//    model.value = !model.value;
//    showValue();
  }, localParams.frequency);
  console.info('Simulated %s actuator started!', pluginName);
};

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pins to which the LCD is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.


