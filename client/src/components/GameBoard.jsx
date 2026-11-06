export default function GameBoard({
	roomCode,
	question,
	isHost,
	watcherCount = 0,
	remainingTimeSeconds,
	onRevealQuestion,
	onRevealAnswer,
	isComplete = false,
	children,
}) {
	const gridRowStyle = {
		gridTemplateRows: `repeat(${Math.ceil(question.answers.length / 2)}, 1fr)`,
	};

	const boardCell = (index) => {
		if (!question || index >= question.answers.length) {
			return <div key={index} className="game-board-cell-empty"></div>;
		}

		const answer = question.answers[index];
		if (!isHost && !answer.revealed) {
			return (
				<div key={index} className="game-board-cell-hidden">
					<span>{index + 1}</span>
				</div>
			);
		}

		return (
			<div key={index} className="game-board-cell-answer">
				<span>{answer.text}</span>
				<span>{answer.points}</span>
				{isHost && (
					<span>
						<button onClick={() => onRevealAnswer(index)}>Reveal</button>
					</span>
				)}
			</div>
		);
	};

	if (isComplete) {
		return <section>{/* <h2>Game {roomCode} complete</h2> */}</section>;
	}

	return (
		<section>
			{/* <h2>Game {roomCode}</h2> */}
			{remainingTimeSeconds !== null && (
				<h3>Timer: {remainingTimeSeconds} seconds</h3>
			)}
			{/* <h3>Watchers: {watcherCount}</h3> */}
			<h2>
				{isHost || question.questionRevealed
					? question.question
					: "Question hidden"}
			</h2>
			{isHost && !question.questionRevealed && (
				<button onClick={onRevealQuestion}>Reveal Question</button>
			)}
			{/* <table>
				{question.answers.map((answer, answerIndex) => (
					<tr key={`${questionIndex}-${answerIndex}`}>
						<td>{isHost || answer.revealed ? answer.text : answerIndex + 1}</td>
						<td>{(isHost || answer.revealed) && answer.points}</td>
						{isHost && (
							<td>
								<button onClick={() => onRevealAnswer(answerIndex)}>
									Reveal
								</button>
							</td>
						)}
					</tr>
				))}
			</table> */}
			<div className="game-board" style={gridRowStyle}>
				{Array.from({ length: Math.ceil(question.answers.length / 2) * 2 }).map(
					(_, index) => boardCell(index),
				)}
			</div>
			{children}
		</section>
	);
}
