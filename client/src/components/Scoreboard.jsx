import TeamScore from "./TeamScore";

export default function Scoreboard({
	teams,
	isHost,
	scoreIncrement = 5,
	onScoreIncrementChange,
	updateScore,
	updateName,
	addTeam,
	removeTeam,
	highlightWinners = false,
}) {
	const winningScore = teams.length
		? Math.max(...teams.map((team) => team.score))
		: null;

	return (
		<div className="scoreboard">
			{isHost && (
				<div className="scoreboard-team-actions">
					<label>
						Score increment
						<input
							type="number"
							min="1"
							value={scoreIncrement}
							onChange={(e) => onScoreIncrementChange(Number(e.target.value))}
						/>
					</label>
					<button onClick={addTeam}>Add Team</button>
				</div>
			)}
			<div className="scoreboard-teams">
				{teams.map((team) => (
					<TeamScore
						key={team.id}
						id={team.id}
						teamName={team.name}
						score={team.score}
						isHost={isHost}
						updateScore={updateScore}
						updateName={updateName}
						removeTeam={removeTeam}
						increment={scoreIncrement}
						isWinner={highlightWinners && team.score === winningScore}
					/>
				))}
			</div>
		</div>
	);
}
