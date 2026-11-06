export default function TeamScore({
	id,
	teamName,
	score,
	isHost,
	updateScore,
	updateName,
	removeTeam,
	increment = 5,
}) {
	return (
		<div>
			{isHost ? (
				<input
					type="text"
					value={teamName}
					onChange={(e) => updateName(id, e.target.value)}
				/>
			) : (
				<h3>{teamName}</h3>
			)}
			<p>Score: {score}</p>
			{isHost && (
				<span>
					<button onClick={() => updateScore(id, score + increment)}>+</button>
					<button onClick={() => updateScore(id, score - increment)}>-</button>
					<button onClick={() => removeTeam(id)}>x</button>
				</span>
			)}
		</div>
	);
}
