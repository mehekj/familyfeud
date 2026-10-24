export default function HostControls({
	timerLengthSeconds,
	onTimerLengthChange,
	onStartTimer,
	onStopTimer,
	onNextQuestion,
	hasNextQuestion,
}) {
	return (
		<div>
			<label>
				Timer length (seconds)
				<input
					type="number"
					min="1"
					value={timerLengthSeconds}
					onChange={(event) => onTimerLengthChange(Number(event.target.value))}
				/>
			</label>
			<button onClick={onStartTimer}>Start Timer</button>
			<button onClick={onStopTimer}>Stop Timer</button>
			<button disabled={!hasNextQuestion} onClick={onNextQuestion}>
				Next Question
			</button>
		</div>
	);
}
