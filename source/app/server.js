/*
	
https://letsencrypt.org/docs/certificates-for-localhost/	
	
openssl req -x509 -days 9999 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
   
Do we ship with an SSL cert or require them to generate one?
	
*/

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const net = require('net');

const params = JSON.parse(process.argv[2]);

const serverOptions = {
	cert: fs.readFileSync(__dirname + '/certs/localhost.crt'),
	key: fs.readFileSync(__dirname + '/certs/localhost.key')
};

const server = https.createServer(serverOptions);

const wss = new WebSocket.Server({ server });

console.log('starting server');

let client;

wss.on('listening', function(){
	console.log('listening for connections on port ' + params.listenport);	
	
	client = new net.Socket();
		
	client.on('error', function(){
		console.error('Unabled to connect to ' + params.ipaddress + ':' + params.port);
	});
	
	client.on('close', function(){
		console.error('Unabled to connect to ' + params.ipaddress + ':' + params.port);
	});
	
	client.connect(params.port, params.ipaddress, function() {
		console.log('Connected to printer');
	});
	
});

wss.on('error', function(error){
	console.error(error.message);
});

wss.on('connection', function connection(ws){
	
  	ws.on('message', function incoming(message){
	  	client.write(message);
	  	console.log('Printing');
  		
  	});
  
});

server.listen(params.listenport);

