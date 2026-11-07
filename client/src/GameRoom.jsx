import { useEffect, useRef, useState } from "react";
import GameBoard from "./components/GameBoard";
import GameLobby from "./components/GameLobby";
import HostControls from "./components/HostControls";
import Scoreboard from "./components/Scoreboard";
import answerRevealSound from "./assets/answerreveal.mp3";
import questionRevealSound from "./assets/questionreveal.mp3";
import timeUpSound from "./assets/timesup.mp3";
import { createInitialGameState } from "./gameQuestions";
import { subscribeSocketEvents } from "./socketEvents";
import { useGameTimer } from "./useGameTimer";

const DEFAULT_TIMER_LENGTH_SECONDS = 30;

const playSound = (soundFile) => {
	const sound = new Audio(soundFile);
	sound.play().catch(() => {
		// Browsers may block audio until the user has interacted with the page.
	});
};

export default function GameRoom({
	roomCode,
	role,
	socket,
	initialGameState = null,
	onReturnToStart,
}) {
	const [gameState, setGameState] = useState(initialGameState);
	const [requestedTimerLengthSeconds, setRequestedTimerLengthSeconds] =
		useState(DEFAULT_TIMER_LENGTH_SECONDS);
	const previousGameStateRef = useRef(null);
	const previousRemainingTimeRef = useRef(null);
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

	useEffect(() => {
		const previousGameState = previousGameStateRef.current;
		previousGameStateRef.current = gameState;

		if (!previousGameState || !gameState) return;

		const questionIndex = gameState.currentQuestionIndex;
		if (previousGameState.currentQuestionIndex !== questionIndex) return;

		const currentQuestion = gameState.questions[questionIndex];
		const previousQuestion = previousGameState.questions[questionIndex];
		if (!currentQuestion || !previousQuestion) return;

		if (
			!previousQuestion.questionRevealed &&
			currentQuestion.questionRevealed
		) {
			playSound(questionRevealSound);
		}

		const hasNewlyRevealedAnswer = currentQuestion.answers.some(
			(answer, index) =>
				!previousQuestion.answers[index]?.revealed && answer.revealed,
		);
		if (hasNewlyRevealedAnswer) playSound(answerRevealSound);
	}, [gameState]);

	useEffect(() => {
		const previousRemainingTime = previousRemainingTimeRef.current;
		previousRemainingTimeRef.current = remainingTimeSeconds;

		if (previousRemainingTime > 0 && remainingTimeSeconds === 0) {
			playSound(timeUpSound);
		}
	}, [remainingTimeSeconds]);

	const toggleAnswer = (answerIndex) => {
		setGameState((currentState) => ({
			...currentState,
			questions: currentState.questions.map((question, questionIndex) =>
				questionIndex !== currentState.currentQuestionIndex
					? question
					: {
							...question,
							answers: question.answers.map((answer, index) =>
								index === answerIndex
									? { ...answer, revealed: !answer.revealed }
									: answer,
							),
						},
			),
		}));
	};

	const toggleQuestion = () => {
		setGameState((currentState) => ({
			...currentState,
			questions: currentState.questions.map((question, questionIndex) =>
				questionIndex === currentState.currentQuestionIndex
					? { ...question, questionRevealed: !question.questionRevealed }
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

	const previousQuestion = () => {
		setGameState((currentState) => ({
			...currentState,
			currentQuestionIndex: Math.max(currentState.currentQuestionIndex - 1, 0),
		}));
	};

	const handleStartTimer = () => {
		startTimer(requestedTimerLengthSeconds);
	};

	const handleToggleTimer = () => {
		if (remainingTimeSeconds > 0) {
			stopTimer();
			return;
		}

		handleStartTimer();
	};

	const handleEndGame = () => {
		if (window.confirm("End this game for everyone?")) {
			socket.emit("game:end", { roomCode });
		}
	};

	const updateTeamScore = (teamId, newScore) => {
		setGameState((currentState) => ({
			...currentState,
			teams: currentState.teams.map((team) =>
				team.id === teamId ? { ...team, score: newScore } : team,
			),
		}));
	};

	const updateTeamName = (teamId, newName) => {
		setGameState((currentState) => ({
			...currentState,
			teams: currentState.teams.map((team) =>
				team.id === teamId ? { ...team, name: newName } : team,
			),
		}));
	};

	const addTeam = () => {
		setGameState((currentState) => {
			const newTeamId =
				currentState.teams.length === 0
					? 1
					: currentState.teams[currentState.teams.length - 1].id + 1;
			const newTeam = { id: newTeamId, name: `Team ${newTeamId}`, score: 0 };
			return {
				...currentState,
				teams: [...currentState.teams, newTeam],
			};
		});
	};

	const removeTeam = (teamId) => {
		setGameState((currentState) => ({
			...currentState,
			teams: currentState.teams.filter((team) => team.id !== teamId),
		}));
	};

	if (!gameState) {
		return (
			<GameLobby
				roomCode={roomCode}
				isHost={isHost}
				onStartGame={
					isHost ? () => setGameState(createInitialGameState()) : undefined
				}
				onEndGame={isHost ? handleEndGame : undefined}
			/>
		);
	}

	if (!currentQuestion) {
		return (
			<GameBoard isComplete>
				<Scoreboard teams={gameState.teams} isHost={false} highlightWinners />
				<button onClick={() => onReturnToStart(roomCode, role)}>
					Return to Start Screen
				</button>
			</GameBoard>
		);
	}

	return (
		<GameBoard
			question={currentQuestion}
			isHost={isHost}
			remainingTimeSeconds={remainingTimeSeconds}
			onToggleAnswer={toggleAnswer}
		>
			{isHost && (
				<HostControls
					timerLengthSeconds={requestedTimerLengthSeconds}
					onTimerLengthChange={setRequestedTimerLengthSeconds}
					onToggleTimer={handleToggleTimer}
					isTimerRunning={remainingTimeSeconds > 0}
					onToggleQuestion={toggleQuestion}
					questionRevealed={currentQuestion.questionRevealed}
					onNextQuestion={nextQuestion}
					onPreviousQuestion={previousQuestion}
					hasNextQuestion={
						gameState.currentQuestionIndex < gameState.questions.length - 1
					}
					hasPreviousQuestion={gameState.currentQuestionIndex > 0}
				/>
			)}
			<Scoreboard
				teams={gameState.teams}
				isHost={isHost}
				updateScore={updateTeamScore}
				updateName={updateTeamName}
				addTeam={addTeam}
				removeTeam={removeTeam}
			/>
			{isHost && <button onClick={handleEndGame}>End Game</button>}
		</GameBoard>
	);
}
