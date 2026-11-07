export default function GameBoard({
	question,
	isHost,
	remainingTimeSeconds,
	onToggleAnswer,
	isComplete = false,
	children,
}) {
	if (isComplete) {
		return (
			<section className="game-over-screen">
				<h2>Game over!</h2>
				{children}
			</section>
		);
	}

	const MIN_GRID_CELLS = 8;

	if (!question) return null;

	const timerText =
		remainingTimeSeconds === null
			? "\u00a0"
			: remainingTimeSeconds > 0
				? `${remainingTimeSeconds}`
				: "Time's up!";

	const cellCount = Math.max(
		MIN_GRID_CELLS,
		Math.ceil(question.answers.length / 2) * 2,
	);

	const gridRowStyle = {
		gridTemplateRows: `repeat(${cellCount / 2}, 1fr)`,
	};

	const boardCell = (index) => {
		if (index >= question.answers.length) {
			return <div key={index} className="game-board-cell-empty"></div>;
		}

		const answer = question.answers[index];
		if (!isHost && !answer.revealed) {
			return (
				<div key={index} className="game-board-cell-hidden">
					<span className="game-board-cell-number">{index + 1}</span>
				</div>
			);
		}

		return (
			<div key={index} className="game-board-cell-answer">
				<span>{answer.text}</span>
				<span className="game-board-cell-points">{answer.points}</span>
				{isHost && (
					<span>
						<button
							disabled={!question.questionRevealed}
							onClick={() => onToggleAnswer(index)}
						>
							{answer.revealed ? "Hide" : "Reveal"}
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
				<h2 className="game-question">
					{isHost || question.questionRevealed ? question.question : "???"}
				</h2>
				<div className="game-board" style={gridRowStyle}>
					{Array.from({
						length: cellCount,
					}).map((_, index) => boardCell(index))}
				</div>
			</div>
			{children}
		</section>
	);
}
