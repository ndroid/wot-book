var mqttKey = '7VH7PX53O3YXB9AN';
var channelKey = 'QNZX1HHTT68JGLPF';
var channelID = '480910';
var fieldNumber = 'field3';
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.thingspeak.com:1883', {username: 'miller4', password: mqttKey});
var topic = 'channels/'+channelID+'/publish/fields/'+fieldNumber+'/'+channelKey;
var presence = 0,
    lastValue = 0,
    interval;
var Gpio = require('onoff').Gpio,
	sensor = new Gpio(17, 'in', 'both', {debounceTimeout: 25});    //#A
 
client.on('connect', function () {
  console.log('MQTT connection established');
//  client.subscribe('presence');
  client.publish(topic, String(0));
});

interval = setInterval(function () {
  if (presence != lastValue)
    if (client.connected) {
      client.publish(topic, String(presence));
      lastValue = presence;
    }
  presence = 0;
}, 20000);

sensor.watch(function (err, value) { //#B
  if (err) exit(err);
  console.log(value ? 'present' : 'absent');
  if (value) {
    presence = 1;
//      client.publish(topic, String(value), {qos: 1}, function (err) {
//          if (err) exit(err);
//          console.log('send complete');
//        });
  }
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
