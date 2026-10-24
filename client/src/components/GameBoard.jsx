export default function GameBoard({
	roomCode,
	question,
	questionIndex,
	isHost,
	remainingTimeSeconds,
	onRevealQuestion,
	onRevealAnswer,
	isComplete = false,
	children,
}) {
	if (isComplete) {
		return (
			<section>
				<h2>Game {roomCode} complete</h2>
			</section>
		);
	}

	return (
		<section>
			<h2>Game {roomCode}</h2>
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
			<ul>
				{question.answers.map((answer, answerIndex) => (
					<li key={`${questionIndex}-${answerIndex}`}>
						{isHost || answer.revealed
							? `${answer.text} — ${answer.points} points`
							: "???"}
						{isHost && !answer.revealed && (
							<button onClick={() => onRevealAnswer(answerIndex)}>
								Reveal Answer
							</button>
						)}
					</li>
				))}
			</ul>
			{children}
		</section>
	);
}
