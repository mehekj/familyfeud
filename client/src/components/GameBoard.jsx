export default function GameBoard({
	question,
	isHost,
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
		return <section>Game over!</section>;
	}

	return (
		<section>
			{remainingTimeSeconds !== null && (
				<h3>Timer: {remainingTimeSeconds} seconds</h3>
			)}
			<h2>
				{isHost || question.questionRevealed
					? question.question
					: "Question hidden"}
			</h2>
			{isHost && !question.questionRevealed && (
				<button onClick={onRevealQuestion}>Reveal Question</button>
			)}
			<div className="game-board" style={gridRowStyle}>
				{Array.from({ length: Math.ceil(question.answers.length / 2) * 2 }).map(
					(_, index) => boardCell(index),
				)}
			</div>
			{children}
		</section>
	);
}
