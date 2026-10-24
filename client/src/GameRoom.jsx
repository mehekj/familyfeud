import { useEffect, useState } from "react";
import { createInitialGameState } from "./gameQuestions";
import { useGameTimer } from "./useGameTimer";
import { subscribeSocketEvents } from "./socketEvents";
import GameBoard from "./components/GameBoard";
import GameLobby from "./components/GameLobby";
import HostControls from "./components/HostControls";

const DEFAULT_TIMER_LENGTH_SECONDS = 30;

export default function GameRoom({
	roomCode,
	role,
	socket,
	initialGameState = null,
}) {
	const [gameState, setGameState] = useState(initialGameState);
	const [requestedTimerLengthSeconds, setRequestedTimerLengthSeconds] =
		useState(DEFAULT_TIMER_LENGTH_SECONDS);
	const { remainingTimeSeconds, startTimer, stopTimer } = useGameTimer(
		socket,
		roomCode,
	);
	const isHost = role === "host";
	const currentQuestion = gameState?.questions[gameState.currentQuestionIndex];

	useEffect(() => {
		const unsubscribe = subscribeSocketEvents(socket, {
			"game:state": ({ roomCode: eventRoomCode, gameState: nextGameState }) => {
				if (eventRoomCode === roomCode) setGameState(nextGameState);
			},
		});

		return unsubscribe;
	}, [roomCode, socket]);

	useEffect(() => {
		if (isHost && gameState?.started) {
			socket.emit("game:publish", { roomCode, gameState });
		}
	}, [gameState, isHost, roomCode, socket]);

	const revealAnswer = (answerIndex) => {
		setGameState((currentState) => ({
			...currentState,
			questions: currentState.questions.map((question, questionIndex) =>
				questionIndex !== currentState.currentQuestionIndex
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

	const revealQuestion = () => {
		setGameState((currentState) => ({
			...currentState,
			questions: currentState.questions.map((question, questionIndex) =>
				questionIndex === currentState.currentQuestionIndex
					? { ...question, questionRevealed: true }
					: question,
			),
		}));
	};

	const nextQuestion = () => {
		setGameState((currentState) => ({
			...currentState,
			currentQuestionIndex: currentState.currentQuestionIndex + 1,
		}));
	};

	const handleStartTimer = () => {
		startTimer(requestedTimerLengthSeconds);
	};

	if (isHost && !gameState) {
		return (
			<GameLobby
				roomCode={roomCode}
				onStartGame={() => setGameState(createInitialGameState())}
			/>
		);
	}

	if (!gameState) {
		return <GameLobby roomCode={roomCode} />;
	}

	if (!currentQuestion) {
		return <GameBoard roomCode={roomCode} isComplete />;
	}

	return (
		<GameBoard
			roomCode={roomCode}
			question={currentQuestion}
			questionIndex={gameState.currentQuestionIndex}
			isHost={isHost}
			remainingTimeSeconds={remainingTimeSeconds}
			onRevealQuestion={revealQuestion}
			onRevealAnswer={revealAnswer}
		>
			{isHost && (
				<HostControls
					timerLengthSeconds={requestedTimerLengthSeconds}
					onTimerLengthChange={setRequestedTimerLengthSeconds}
					onStartTimer={handleStartTimer}
					onStopTimer={stopTimer}
					onNextQuestion={nextQuestion}
					hasNextQuestion={
						gameState.currentQuestionIndex < gameState.questions.length - 1
					}
				/>
			)}
		</GameBoard>
	);
}
