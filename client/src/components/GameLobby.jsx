export default function GameLobby({
	roomCode,
	isHost,
	onStartGame,
	onEndGame,
}) {
	return (
		<section>
			<h2>{isHost ? "Host Dashboard" : `You are viewing game ${roomCode}`}</h2>
			<p>
				{isHost
					? `Game code: ${roomCode}. Enter the code on another device/window to display the board as a player.`
					: "Waiting for the host to start the game…"}
			</p>
			{isHost && onStartGame && (
				<button onClick={onStartGame}>Start Game</button>
			)}
			{isHost && onEndGame && <button onClick={onEndGame}>End Game</button>}
		</section>
	);
}
