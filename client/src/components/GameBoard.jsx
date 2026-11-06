export default function GameBoard({
	question,
	isHost,
	remainingTimeSeconds,
	onRevealAnswer,
	isComplete = false,
	children,
}) {
	if (isComplete) {
		return <section>Game over!</section>;
	}

	if (!question) return null;

	const timerText =
		remainingTimeSeconds === null
			? "\u00a0"
			: remainingTimeSeconds > 0
				? `Timer: ${remainingTimeSeconds} seconds`
				: "Time's up!";

	const gridRowStyle = {
		gridTemplateRows: `repeat(${Math.ceil(question.answers.length / 2)}, 1fr)`,
	};

	const boardCell = (index) => {
		if (index >= question.answers.length) {
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
						<button
							disabled={!question.questionRevealed || answer.revealed}
							onClick={() => onRevealAnswer(index)}
						>
							Reveal
						</button>
					</span>
				)}
			</div>
		);
	};

	return (
		<section className="game-board-container">
			<h3 className="game-timer" aria-live="polite">
				{timerText}
			</h3>
			<div className="game-board-content">
				<h2>
					{isHost || question.questionRevealed ? question.question : "???"}
				</h2>
				<div className="game-board" style={gridRowStyle}>
					{Array.from({
						length: Math.ceil(question.answers.length / 2) * 2,
					}).map((_, index) => boardCell(index))}
				</div>
			</div>
			{children}
		</section>
	);
}
