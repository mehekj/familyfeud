import TeamScore from "./TeamScore";
import { useState } from "react";

export default function Scoreboard({
	teams,
	isHost,
	updateScore,
	updateName,
	addTeam,
	removeTeam,
	highlightWinners = false,
}) {
	const [increment, setIncrement] = useState(5);
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
							defaultValue={5}
							onChange={(e) => setIncrement(Number(e.target.value))}
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
						increment={increment}
						isWinner={highlightWinners && team.score === winningScore}
					/>
				))}
			</div>
		</div>
	);
}
