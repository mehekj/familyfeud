import { useEffect, useState } from "react";
import GameBoard from "./components/GameBoard";
import GameLobby from "./components/GameLobby";
import HostControls from "./components/HostControls";
import RoomStatus from "./components/RoomStatus";
import Scoreboard from "./components/Scoreboard";
import { createInitialGameState } from "./gameQuestions";
import { subscribeSocketEvents } from "./socketEvents";
import { useGameTimer } from "./useGameTimer";

const DEFAULT_TIMER_LENGTH_SECONDS = 30;

export default function GameRoom({
	roomCode,
	role,
	socket,
	initialGameState = null,
	watcherCount = 0,
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

	const previousQuestion = () => {
		setGameState((currentState) => ({
			...currentState,
			currentQuestionIndex: Math.max(currentState.currentQuestionIndex - 1, 0),
		}));
	};

	const handleStartTimer = () => {
		startTimer(requestedTimerLengthSeconds);
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

	if (isHost && !gameState) {
		return (
			<GameLobby
				roomCode={roomCode}
				onStartGame={() => setGameState(createInitialGameState())}
				onEndGame={handleEndGame}
			>
				<RoomStatus roomCode={roomCode} watcherCount={watcherCount} />
			</GameLobby>
		);
	}

	if (!gameState) {
		return <GameLobby roomCode={roomCode} />;
	}

	if (!currentQuestion) {
		return (
			<>
				<GameBoard isComplete />
				{isHost && <button onClick={handleEndGame}>End Game</button>}
			</>
		);
	}

	return (
		<GameBoard
			question={currentQuestion}
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
