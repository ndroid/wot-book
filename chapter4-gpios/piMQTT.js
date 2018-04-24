const tempID = 1;
const humidID = 2;
const pirID = 3;
const redID = 4;
const greenID = 5;
const blueID = 6;
const yellowID = 7;
const cmID = 8;
const PUBDELAY = 16000;
const TEMPDELAY = 120000;
const DEBOUNCE = 40;

const mqttKey = '7VH7PX53O3YXB9AN';
const channelKey = 'QNZX1HHTT68JGLPF';
const channelID = '480910';
const fieldTemp = 'field1';
const fieldHumid = 'field2';
const fieldPIR = 'field3';
const fieldR = 'field4';
const fieldB = 'field6';
const fieldY = 'field7';
const fieldG = 'field5';
const fieldID = 'field8';

var presence = 0,
    waitQueue = 1;
var onoff = require('onoff'); //#A

var Gpio = onoff.Gpio,
  ledR = new Gpio(5, 'out'), //#B
  ledB = new Gpio(6, 'out'), //#B
  ledY = new Gpio(13, 'out'), //#B
  ledG = new Gpio(19, 'out'), //#B
  pir = new Gpio(17, 'in', 'none', {debounceTimeout: DEBOUNCE});    //#A

var sensorLib = require('node-dht-sensor'),
    temperature,
    humidity;
var pirTimer,
    queueTimer,
    tempTimer;

  sensorLib.initialize(22, 12); //#A
  
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.thingspeak.com:1883', {username: 'miller4', password: mqttKey});
var pubTopic = 'channels/'+channelID+'/publish/fields/'; //+fieldNumber+'/'+channelKey;
var subTopic = 'channels/'+channelID+'/subscribe/fields/+/'+channelKey;
var initPublish = fieldPIR + "=0&" + fieldR + "=0&" + fieldG + "=0&" + fieldB + "=0&" + fieldY + "=0";

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    if (!this.items.includes(item))
      this.items.push(item);
    console.log('Enqueue : ' + item + ' Q:' + this.items);
  }

  dequeue() {
    if(this.items.length > 0)
      return this.items.shift();
    return 0;
  }

  isEmpty() {
    return (this.items.length == 0);
  }
}

var queue = new Queue();

client.on('connect', function () {
  console.log('MQTT connection established');
//  client.subscribe('presence');
  ledR.write(0, function() { //#E
    console.log("Set LEDR state to: 0");
  });
  ledB.write(0, function() { //#E
    console.log("Set LEDB state to: 0");
  });
  ledY.write(0, function() { //#E
    console.log("Set LEDY state to: 0");
  });
  ledG.write(0, function() { //#E
    console.log("Set LEDG state to: 0");
  });

  waitQueue = 1;
  client.publish('channels/'+channelID+'/publish/'+channelKey, initPublish);
  queueTimer = setTimeout(scheduleQueue, PUBDELAY);

  pir.setEdge('both');
  readTemp();
  client.subscribe(subTopic);
});

function scheduleQueue() {
  var id, field, value;
  id = queue.dequeue();
  switch(id) {
    case tempID:
      field = fieldTemp;
      value = temperature;
      break;
    case humidID:
      field = fieldHumid;
      value = humidity;
      break;
    case pirID: 
      field = fieldPIR;
      value = presence;
      break;
    case redID: 
      field = fieldR;
      value = ledR.readSync();
      break;
    case greenID: 
      field = fieldG;
      value = ledG.readSync();
      break;
    case blueID: 
      field = fieldB;
      value = ledB.readSync();
      break;
    case yellowID: 
      field = fieldY;
      value = ledY.readSync();
      break;
    case cmID: 
      field = fieldID;
      value = 0;
      break;
    default:
      waitQueue = 0; 
      return;
  }
  client.publish(pubTopic+field+'/'+channelKey, String(value));
  queueTimer = setTimeout(scheduleQueue, PUBDELAY);
  console.log("publish to " + field + " value: " + String(value));
}

function publishField(id, field, value) {
  if(waitQueue == 0) {
    waitQueue = 1;
    client.publish(pubTopic+field+'/'+channelKey, String(value));
    queueTimer = setTimeout(scheduleQueue, PUBDELAY);
    console.log("publish to " + field + " value: " + String(value));
  }
  else {
    queue.enqueue(id);
  }
  
}

function readTemp() {
  var readout = sensorLib.read(); //#C
  temperature = readout.temperature.toFixed(2);
  humidity = readout.humidity.toFixed(2);
  console.log('Temperature: ' + temperature + 'C, ' + //#D
    'humidity: ' + humidity + '%');
  publishField(tempID, fieldTemp, temperature);
  publishField(humidID, fieldHumid, humidity);
  tempTimer = setTimeout(readTemp, TEMPDELAY);
};

pir.watch(function (err, value) { //#B
  if (err) exitMsg(err);
  console.log(value ? 'present' : 'absent');
  if (value) {
    if (presence == 0) {
      presence = 1;
      publishField(pirID, fieldPIR, 1);
    }
    clearTimeout(pirTimer);
    pirTimer = setTimeout(motionDetect, 30000);
  }
});

function motionDetect() {
  presence = 0;
  publishField(pirID, fieldPIR, 0);
}

client.on('message', function (topic, message) {
  console.log(topic + ': ' + message.toString());
  var fields = topic.split('/');
  var value = Number(message.toString());
  if(fields[4] == fieldR) {
    if(ledR.readSync() != value) {
      if ((value >> 1) == 0)
        ledR.write(value, function() { //#E
          console.log("Changed LEDR state to: " + value);
        });
      else
        publishField(redID, fieldR, ledR.readSync());
    }
  }
  else if(fields[4] == fieldB) {
    if(ledB.readSync() != value) {
      if ((value >> 1) == 0)
        ledB.write(value, function() { //#E
          console.log("Changed LEDB state to: " + value);
        });
      else
        publishField(blueID, fieldB, ledB.readSync());
    }
  }
  else if(fields[4] == fieldY) {
    if(ledY.readSync() != value) {
      if ((value >> 1) == 0)
        ledY.write(value, function() { //#E
          console.log("Changed LEDY state to: " + value);
        });
      else
        publishField(yellowID, fieldY, ledY.readSync());
    }
  }
  else if(fields[4] == fieldG) {
    if(ledG.readSync() != value) {
      if ((value >> 1) == 0)
        ledG.write(value, function() { //#E
          console.log("Changed LEDG state to: " + value);
        });
      else
        publishField(greenID, fieldG, ledG.readSync());
    }
  }
});

function exitMsg(err) {
  if (err) console.log('An error occurred: ' + err);
  process.exit();
}

process.on('SIGINT', function () { //#F
//  clearInterval(interval);
  clearTimeout(tempTimer);
  clearTimeout(pirTimer);
  clearTimeout(queueTimer);
  client.end();
  ledR.writeSync(0); //#G
  ledR.unexport();
  ledB.writeSync(0); //#G
  ledB.unexport();
  ledY.writeSync(0); //#G
  ledY.unexport();
  ledG.writeSync(0); //#G
  ledG.unexport();
  pir.unexport();
  console.log('Bye, bye!');
  process.exit();
});

// #A Import the onoff library
// #B Initialize pin 4 to be an output pin
// #C This interval will be called every 2 seconds
// #D Synchronously read the value of pin 4 and transform 1 to 0 or 0 to 1
// #E Asynchronously write the new value to pin 4
// #F Listen to the event triggered on CTRL+C
// #G Cleanly close the GPIO pin before exiting
