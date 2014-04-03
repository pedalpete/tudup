var http = require('http');
var fs = require('fs');
http.createServer(function (request, response) {
    console.log('request starting...');
  
   if ( request.url == '/') {
    request.url = 'index.html';
  }
  var filePath =  request.url;
 
 
  var extname = filePath.split('.').pop();
  var contentType = 'text/html';
  switch (extname) {
    case 'js':
      contentType = 'text/javascript';
      break;
    case 'map':  //for debugging
      contentType = 'text/javascript';
      break;
    case 'css':
      contentType = 'text/css';
      break;
    case 'json': 
      contentType = 'application/json';
      break;
  }
  
  filePath = './www/'+filePath;
  fs.exists(filePath, function(exists) {
  
    if (exists) {
      fs.readFile(filePath, function(error, content) {
        if (error) {
          response.writeHead(500);
          response.end();
        }
        else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    }
    else {
      response.writeHead(404);
      response.end();
    }
  });
  
}).listen(Number(process.env.PORT || 8080));