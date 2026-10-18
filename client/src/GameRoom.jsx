import { useEffect, useState } from "react";
import { createInitialGameState } from "./gameQuestions";
import { subscribeSocketEvents } from "./socketEvents";

export default function GameRoom({ room, role, socket, initialState = null }) {
	const [gameState, setGameState] = useState(initialState);
	const isHost = role === "host";

	useEffect(() => {
		const unsubscribe = subscribeSocketEvents(socket, {
			"game:state": ({ room: stateRoom, state }) => {
				if (stateRoom === room) setGameState(state);
			},
		});

		return unsubscribe;
	}, [room, socket]);

	useEffect(() => {
		if (isHost && gameState?.started) {
			socket.emit("game:publish", { room, state: gameState });
		}
	}, [gameState, isHost, room, socket]);

	var revealAnswer = (answerIndex) => {
		setGameState((current) => ({
			...current,
			questions: current.questions.map((question, questionIndex) =>
				questionIndex !== current.currentQuestionIndex
					? question
					: {
							...question,
							answers: question.answers.map((answer, index) =>
								index === answerIndex ? { ...answer, revealed: true } : answer,
							),
						},
			),
		}));
	};

	var nextQuestion = () => {
		setGameState((current) => ({
			...current,
			currentQuestionIndex: current.currentQuestionIndex + 1,
		}));
	};

	if (isHost && !gameState) {
		return (
			<section>
				<h2>Host Dashboard</h2>
				<p>Game code: {room}</p>
				<button onClick={() => setGameState(createInitialGameState())}>
					Start Game
				</button>
			</section>
		);
	}

	if (!gameState) {
		return (
			<section>
				<h2>Game {room}</h2>
				<p>Waiting for the host to start the game…</p>
			</section>
		);
	}

	const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
	if (!currentQuestion) {
		return (
			<section>
				<h2>Game complete</h2>
			</section>
		);
	}

	return (
		<section>
			<h2>{currentQuestion.question}</h2>
			<ul>
				{currentQuestion.answers.map((answer, answerIndex) => (
					<li key={`${gameState.currentQuestionIndex}-${answerIndex}`}>
						{isHost || answer.revealed
							? `${answer.text} — ${answer.points} points`
							: "???"}
						{isHost && !answer.revealed && (
							<button onClick={() => revealAnswer(answerIndex)}>
								Reveal Answer
							</button>
						)}
					</li>
				))}
			</ul>
			{isHost && (
				<button
					disabled={
						gameState.currentQuestionIndex >= gameState.questions.length - 1
					}
					onClick={nextQuestion}
				>
					Next Question
				</button>
			)}
		</section>
	);
}
