var http = require("http");
var authKey = require('./apikey.json');
var port = 40213;

var request = require("request");

http.createServer(function(req,res){
  console.log('New incoming client request for ' + req.url);

  var options = { method: 'GET',
    url: 'https://api.yelp.com/v3/businesses'+req.url,
//  qs: { location: '%2240213%22', sort_by: 'rating' },
    headers: 
     {
//     'Cache-Control': 'no-cache',
      Authorization: authKey.key,
      Accept: 'application/json' }
//     body: '{"value":"via json"}' 
  };
  
  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}); //#A
    res.write(body);
    res.end();  //#D
  });

//  switch(req.url) { //#B
//    case '/temperature':
}).listen(port);
console.log('Server listening on http://localhost:' + port);

//#A Setting the header to announce we return JSON representations
//#B Read the request URL and provide responses accordingly
//#C Write the temperature result as JSON
//#D Causes to return the results to the client
