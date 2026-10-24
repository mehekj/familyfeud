export default function GameLobby({ roomCode, onStartGame }) {
	return (
		<section>
			<h2>{onStartGame ? "Host Dashboard" : `Game ${roomCode}`}</h2>
			<p>
				{onStartGame
					? `Game code: ${roomCode}`
					: "Waiting for the host to start the game…"}
			</p>
			{onStartGame && <button onClick={onStartGame}>Start Game</button>}
		</section>
	);
}
