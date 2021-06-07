require('dotenv').config();
const express = require('express');
const ws = require('ws');
const { uuidv4, random } = require('./utils');
const Game = require('./game');

const app = express();

app.get('/', (req, res) => {
	res.status(200).send('Hello world!');
});

app.all('*', (req, res) => {
	res.sendStatus(404);
});


const games = [];
// const g1 = new Game(uuidv4());
// g1.addPlayer(uuidv4(), "test username", null);
// const games = (new Array(40)).fill(0).map(() => g1);

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
	socket.on('message', (message) => {
		try {
			console.log(message);
			const json = JSON.parse(message);
			if (json.type === 'create' && json.username) {
				const game = new Game(uuidv4());
				games.push(game);
				const userId = uuidv4();
				game.addPlayer(userId, json.username, socket);
				socket.send(JSON.stringify({
					type: 'create',
					gameId: game.id,
					userId
				}));
			}
			else if (json.type === 'list') {
				socket.send(JSON.stringify({
					type: 'list',
					games: games
						.filter(game => game.playing === false)
						.map(game => ({
							id: game.id,
							username: game.players[0].username
						}))
				}));
			}
			else if (json.type === 'join' && json.gameId && json.username) {
				const game = games.find(game => game.id === json.gameId);
				if (!game) {
					return socket.send(JSON.stringify({
						type: 'list',
						games: games
							.filter(game => game.playing === false)
							.map(game => ({
								id: game.id,
								username: game.players[0].username
							}))
					}));
				}
				const userId = uuidv4();
				const youStart = random(0, 1) === 0;
				game.addPlayer(userId, json.username, socket);
				socket.send(JSON.stringify({
					type: 'join',
					userId,
					youStart
				}));
				game.players[0].socket.send(JSON.stringify({
					type: 'start',
					youStart: !youStart
				}));
			}
			else if (json.type === 'end' && json.userId) {
				const game = gameByUserId(json.userId);
				if (!game)
					return;
				const otherPlayer = game.players.find(player => player.userId !== json.userId);
				otherPlayer.socket.send(JSON.stringify({
					type: 'end',
					youWin: true
				}));
				games.splice(games.indexOf(game), 1);
			}
			else if (json.type === 'token' && json.userId && json.column !== undefined) {
				const game = gameByUserId(json.userId);
				if (!game)
					return;
				const otherPlayer = game.players.find(player => player.userId !== json.userId);
				otherPlayer.socket.send(JSON.stringify({
					type: 'token',
					column: json.column
				}));
			}
		}
		catch {}
	});
	socket.on('close', () => {
		const game = gameBySocket(socket);
		if (!game)
			return;
		game.removePlayerBySocket(socket);
		game.players[0]?.send(JSON.stringify({
			type: 'end',
			youWin: true
		}));
		games.splice(games.indexOf(game), 1);
	});
});

function gameByUserId(userId) {
	return games.find(game => game.players.find(player => player.userId === userId));
}
function gameBySocket(socket) {
	return games.find(game => game.players.find(player => player.socket?.id === socket.id));
}


const server = app.listen(process.env.PORT, () => {
	console.log('App listening on port ' + process.env.PORT);
});

server.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket, head, socket => {
		wsServer.emit('connection', socket, request);
	});
});