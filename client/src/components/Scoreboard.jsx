import TeamScore from "./TeamScore";
import { useState } from "react";

export default function Scoreboard({
	teams,
	isHost,
	updateScore,
	updateName,
	addTeam,
	removeTeam,
}) {
	const [increment, setIncrement] = useState(5);

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
					/>
				))}
			</div>
		</div>
	);
}
