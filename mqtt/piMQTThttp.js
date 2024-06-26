var httpServer = require('./servers/http'),
  mqtt = require('mqtt'),
  resources = require('./resources/model');

// Internal Plugins
var ledsPlugin = require('./plugins/internal/ledsPlugin'), //#A
  lcdPlugin = require('./plugins/internal/lcdPlugin'), //#A
  pirPlugin = require('./plugins/internal/pirPlugin'), //#A
  dhtPlugin = require('./plugins/internal/DHT22SensorPlugin'); //#A

// External Plugins
//var coapPlugin = require('./plugins/external/coapPlugin');
//coapPlugin.start({'simulate': false, 'frequency': 10000});

const mqttHost = 'mqtts://70ea6a420c9141169134865c7448b610.s1.eu.hivemq.cloud';
const mqttPort = 8883;
const mqttUser = 'ece49703iot';
const mqttKey = 'RHITIoTece497212203';
  
var mqtt = require('mqtt');
  
var client  = mqtt.connect(mqttHost + ':' + mqttPort, {username: mqttUser, password: mqttKey});

// HTTP Server
var server = httpServer.listen(resources.pi.port, function () {
  console.log('HTTP server started...');

  console.info('Your WoT Pi is up and running on port %s', resources.pi.port);
});
//#A Require all the sensor plugins you need
//#B Start them with a parameter object; here you start them on a laptop so you activate the simulation function

client.on('connect', function () {
  console.log('MQTT connection established');
  
  // Internal Plugins for sensors/actuators connected to the PI GPIOs
  // If you test this with real sensors do not forget to set simulate to 'false'
  pirPlugin.start({'simulate': false, 'frequency': 60000}, client); //#B
  ledsPlugin.start({'simulate': false, 'frequency': 990000}, client); //#B
  lcdPlugin.start({'simulate': false, 'frequency': 1200000}, client); //#B
  dhtPlugin.start({'simulate': false, 'frequency': 10000}, client); //#B

  client.subscribe(resources.pi.sensors.path + '/#');
  client.subscribe(resources.pi.actuators.path + '/#');
});

client.on('message', function (topic, message) {
  console.log('RECEIVED: ' + topic + ': ' + message.toString());
  let fields = topic.split('/');
  if (topic.startsWith(resources.pi.sensors.path)) {
    switch (fields[2]) {
      case resources.pi.sensors.temperature.topic:
      case resources.pi.sensors.humidity.topic:
        if (fields.length === 3) {
          dhtPlugin.message(fields[2], message);
        }
        break;
      case resources.pi.sensors.pir.topic:
        if (fields.length === 3) {
          pirPlugin.message(message);
        }
        break;
      default:
        break;
    }
  }
  else if(topic.startsWith(resources.pi.actuators.path)) {
    switch (fields[2]) {
      case resources.pi.actuators.leds.topic:
        if (fields.length === 4) {
          ledsPlugin.message(fields[3], message);
        }
        break;
      case resources.pi.actuators.lcd.topic:
        if (fields.length === 3) {
          lcdPlugin.message(null, message);
        }
        else if (fields.length === 4) {
          lcdPlugin.message(fields[3], message);
        }
        break;
      default:
        break;
    }
  }
});

process.on('SIGINT', function () { //#F
  client.end();
  pirPlugin.stop(); //#B
  ledsPlugin.stop(); //#B
  lcdPlugin.stop(); //#B
  dhtPlugin.stop(); //#B
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
