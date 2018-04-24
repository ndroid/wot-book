const tempID = 1;
const humidID = 2;
const pirID = 3;
const redID = 4;
const greenID = 5;
const blueID = 6;
const yellowID = 7;
const cmID = 8;
const myCMID = 105;
const BLINKDELAY = 20000;
const RETRYDELAY = 20000;

const mqttKey = 'HVYM22BGX4MYXEPR';
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

var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.thingspeak.com:1883', {username: 'miller4', password: mqttKey});
var pubTopic = 'channels/'+channelID+'/publish/fields/'+fieldB+'/'+channelKey;
var subTopic = 'channels/'+channelID+'/subscribe/fields/'+fieldID+'/'+channelKey;

var blinkTimer;

client.on('connect', function () {
  console.log('MQTT connection established');
//  client.subscribe('presence');
  client.subscribe(subTopic);
});

function publishLED(value) {
  client.publish(pubTopic, String(value));
  if (value == 1)
    blinkTimer = setTimeout(function() { publishLED(0); }, BLINKDELAY);
  console.log("publish to " + fieldB + " value: " + String(value));
}

client.on('message', function (topic, message) {
  console.log(topic + ': ' + message.toString());
  var value = Number(message.toString());
  if (value == myCMID) {
    blinkTimer = setTimeout(function() { publishLED(1); }, BLINKDELAY);
  }
});

process.on('SIGINT', function () { //#F
//  clearInterval(interval);
  clearTimeout(blinkTimer);
  client.end();
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
