var WebSocketServer = require('ws').Server,
  resources = require('./../resources/model');

exports.listen = function(httpserver) {
//  var wss = new WebSocketServer({httpServer: server}); //#A
  var wss = new WebSocketServer({server: httpserver}); //#A
  console.info('WebSocket server started...');
  wss.on('connection', function (ws, request) { //#B
//    console.info(typeof ws);
    console.info(request);
    var url = request.url;
    console.info(url);
    try {
      Object.observe(selectResouce(url), function (changes) { //#C
//      Observable.observe(selectResouce(url), function (changes) { //#C
        ws.send(JSON.stringify(changes[0].object), function () {
          console.log('websocket update sent');
        });
      })
    }
    catch (e) { //#D
      console.log('Unable to observe %s resource!', url);
    };
  });
};

function selectResouce(url) { //#E
  var parts = url.split('/');
  parts.shift();
  var result = resources;
  for (var i = 0; i < parts.length; i++) {
    result = result[parts[i]];
  }
  return result;
}


//#A Create a WebSockets server by passing it the Express server
//#B Triggered after a protocol upgrade when the client connected
//#C Register an observer corresponding to the resource in the protocol upgrade URL
//#D Use a try/catch to catch to intercept errors (e.g., malformed/unsupported URLs)
//#E This function takes a request URL and returns the corresponding resource

