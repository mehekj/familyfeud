export default function HostControls({
	timerLengthSeconds,
	onTimerLengthChange,
	onToggleTimer,
	isTimerRunning,
	onToggleQuestion,
	questionRevealed,
	onNextQuestion,
	onPreviousQuestion,
	hasNextQuestion,
	hasPreviousQuestion,
}) {
	return (
		<div className="host-controls">
			<section
				className="host-control-widget"
				aria-labelledby="question-navigation-heading"
			>
				<h3 id="question-navigation-heading">Question Navigation</h3>
				<div className="host-control-actions">
					<button disabled={!hasPreviousQuestion} onClick={onPreviousQuestion}>
						&lt;
					</button>
					<button disabled={!hasNextQuestion} onClick={onNextQuestion}>
						&gt;
					</button>
					<button onClick={onToggleQuestion}>
						{questionRevealed ? "Hide Question" : "Reveal Question"}
					</button>
				</div>
			</section>
			<section
				className="host-control-widget host-control-widget--timer"
				aria-labelledby="timer-heading"
			>
				<h3 id="timer-heading">Timer</h3>
				<div className="host-control-actions host-control-actions--timer">
					<label className="host-control-timer-length">
						Timer length (seconds)
						<input
							type="number"
							min="1"
							value={timerLengthSeconds}
							onChange={(event) =>
								onTimerLengthChange(Number(event.target.value))
							}
						/>
					</label>
					<button
						className="host-control-button host-control-button--timer-toggle"
						onClick={onToggleTimer}
					>
						{isTimerRunning ? "Stop Timer" : "Start Timer"}
					</button>
				</div>
			</section>
		</div>
	);
}
