export default function GameLobby({ roomCode, onStartGame, onEndGame }) {
	return (
		<section>
			<h2>{onStartGame ? "Host Dashboard" : `Game ${roomCode}`}</h2>
			<p>
				{onStartGame
					? `Game code: ${roomCode}`
					: "Waiting for the host to start the game…"}
			</p>
			{onStartGame && <button onClick={onStartGame}>Start Game</button>}
			{onEndGame && <button onClick={onEndGame}>End Game</button>}
		</section>
	);
}
