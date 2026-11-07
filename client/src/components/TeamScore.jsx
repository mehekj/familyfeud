export default function TeamScore({
	id,
	teamName,
	score,
	isHost,
	updateScore,
	updateName,
	removeTeam,
	increment = 5,
	isWinner = false,
}) {
	return (
		<div
			className={`team-score-widget${isWinner ? " team-score-widget--winner" : ""}`}
		>
			{isWinner && <span className="team-score-winner-badge">Winner</span>}
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
				<div className="team-score-actions">
					<button onClick={() => updateScore(id, score + increment)}>+</button>
					<button onClick={() => updateScore(id, score - increment)}>-</button>
					<button
						aria-label={`Remove ${teamName}`}
						onClick={() => removeTeam(id)}
					>
						Remove
					</button>
				</div>
			)}
		</div>
	);
}
