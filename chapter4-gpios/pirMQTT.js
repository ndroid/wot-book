var mqttKey = '7VH7PX53O3YXB9AN';
var channelKey = 'QNZX1HHTT68JGLPF';
var channelID = '480910';
var fieldNumber = 'field3';
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtts://mqtt.thingspeak.com:1883', {username: 'miller4', password: mqttKey});
var topic = 'channels/'+channelID+'/publish/fields/'+fieldNumber+'/'+channelKey;
var lastValue=2;
var Gpio = require('onoff').Gpio,
	sensor = new Gpio(17, 'in', 'both', {debounceTimeout: 10});    //#A
 
client.on('connect', function () {
  console.log('MQTT connection established');
//  client.subscribe('presence');
//  client.publish('presence', 'Hello mqtt')
});

sensor.watch(function (err, value) { //#B
  if (err) exit(err);
  if (lastValue != value) {
    console.log(value ? 'present' : 'absent');
    if (client.connected())
      client.publish(topic, value);
  }
  lastValue = value;
});

function exit(err) {
  if (err) console.log('An error occurred: ' + err);
  sensor.unexport();
  console.log('Bye, bye!')
  process.exit();
}
process.on('SIGINT', exit);

// #A Initialize pin 17 in input mode, 'both' means we want to handle both rising and falling interrupt edges
// #B Listen for state changes on pin 17, if a change is detected the anonymous callback function will be called with the new value
