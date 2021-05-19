require('dotenv').config();
const express = require('express');
const ws = require('ws');

const app = express();

app.get('/', (req, res) => {
	res.status(200).send('Hello world!');
});

app.all('*', (req, res) => {
	res.sendStatus(404);
})


const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
	socket.on('message', (message) => {
		console.log(message);
		socket.send('coucou');
	});
});


const server = app.listen(process.env.PORT, () => {
	console.log('App listening on port ' + process.env.PORT);
});

server.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket, head, socket => {
		wsServer.emit('connection', socket, request);
	});
});