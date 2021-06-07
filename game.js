class Game {

	constructor(id) {
		this.id = id;
		this.public = true;
		this.playing = false;
		this.players = [];
	}

	setPublic(isPublic) {
		this.public = isPublic;
	}
	setPlaying(playing) {
		this.playing = playing;
	}
	addPlayer(userId, username, socket) {
		this.players.push({ userId, username, socket });
	}
	removePlayerById(userId) {
		this.players = this.players.filter(player => player.userId !== userId);
	}
	removePlayerBySocket(socket) {
		this.players = this.players.filter(player => player.socket?.id !== socket.id);
	}

}

module.exports = Game;