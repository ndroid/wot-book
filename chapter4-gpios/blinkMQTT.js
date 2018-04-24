var mqttKey = '7VH7PX53O3YXB9AN';
var channelKey = 'QNZX1HHTT68JGLPF';
var channelID = '480910';
var fieldR = 'field4';
var fieldB = 'field6';
var fieldY = 'field7';
var fieldG = 'field5';
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.thingspeak.com:1883', {username: 'miller4', password: mqttKey});
var pubTopic = 'channels/'+channelID+'/publish/fields/'; //+fieldNumber+'/'+channelKey;
var subTopic = 'channels/'+channelID+'/subscribe/fields/+/'+channelKey;

var onoff = require('onoff'); //#A

var Gpio = onoff.Gpio,
  ledR = new Gpio(5, 'out'), //#B
  ledB = new Gpio(6, 'out'), //#B
  ledY = new Gpio(13, 'out'), //#B
  ledG = new Gpio(19, 'out'); //#B

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

  client.publish(pubTopic+fieldR+'/'+channelKey, String(0));
  client.publish(pubTopic+fieldB+'/'+channelKey, String(0));
  client.publish(pubTopic+fieldY+'/'+channelKey, String(0));
  client.publish(pubTopic+fieldG+'/'+channelKey, String(0));

  client.subscribe(subTopic);
});

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
        client.publish(pubTopic+fieldR+'/'+channelKey, String(ledR.readSync()));
    }
  }
  else if(fields[4] == fieldB) {
    if(ledB.readSync() != value) {
      if ((value >> 1) == 0)
        ledB.write(value, function() { //#E
          console.log("Changed LEDB state to: " + value);
        });
      else
        client.publish(pubTopic+fieldB+'/'+channelKey, String(ledB.readSync()));
    }
  }
  else if(fields[4] == fieldY) {
    if(ledY.readSync() != value) {
      if ((value >> 1) == 0)
        ledY.write(value, function() { //#E
          console.log("Changed LEDY state to: " + value);
        });
      else
        client.publish(pubTopic+fieldY+'/'+channelKey, String(ledY.readSync()));
    }
  }
  else if(fields[4] == fieldG) {
    if(ledG.readSync() != value) {
      if ((value >> 1) == 0)
        ledG.write(value, function() { //#E
          console.log("Changed LEDG state to: " + value);
        });
      else
        client.publish(pubTopic+fieldG+'/'+channelKey, String(ledG.readSync()));
    }
  }

});

process.on('SIGINT', function () { //#F
//  clearInterval(interval);
  client.end();
  ledR.writeSync(0); //#G
  ledR.unexport();
  ledB.writeSync(0); //#G
  ledB.unexport();
  ledY.writeSync(0); //#G
  ledY.unexport();
  ledG.writeSync(0); //#G
  ledG.unexport();
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