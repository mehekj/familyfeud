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
		<div>
			{isHost && (
				<span>
					increment:{" "}
					<input
						type="number"
						defaultValue={5}
						onChange={(e) => setIncrement(Number(e.target.value))}
					/>
					<button onClick={(e) => addTeam()}>Add Team</button>
				</span>
			)}
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
	);
}
