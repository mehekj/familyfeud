import { useEffect, useState } from "react";
import io from "socket.io-client";
import GameRoom from "./GameRoom";
import { subscribeSocketEvents } from "./socketEvents";
import "./App.css";
import RoomStatus from "./components/RoomStatus";

const HOST_ROOM_CODE_KEY = "familyfeud.hostRoomCode";
const HOST_RESUME_TOKEN_KEY = "familyfeud.hostResumeToken";

function App() {
	const [socket, setSocket] = useState(null);
	const [connected, setConnected] = useState(false);
	const [isResuming, setIsResuming] = useState(false);
	const [session, setSession] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		const clientSocket = io();

		const unsubscribe = subscribeSocketEvents(clientSocket, {
			connect: () => {
				setSocket(clientSocket);
				setConnected(true);
				const roomCode = sessionStorage.getItem(HOST_ROOM_CODE_KEY);
				const resumeToken = sessionStorage.getItem(HOST_RESUME_TOKEN_KEY);
				if (roomCode && resumeToken) {
					setIsResuming(true);
					clientSocket.emit("game:host:resume", { roomCode, resumeToken });
				}
			},
			disconnect: () => setConnected(false),
			"game:created": ({ roomCode, resumeToken }) => {
				sessionStorage.setItem(HOST_ROOM_CODE_KEY, roomCode);
				sessionStorage.setItem(HOST_RESUME_TOKEN_KEY, resumeToken);
				setIsResuming(false);
				setSession({ roomCode, role: "host", watcherCount: 0 });
			},
			"game:host:resumed": ({ roomCode, gameState, watcherCount }) => {
				setIsResuming(false);
				setSession((current) => ({
					roomCode,
					role: "host",
					initialGameState: gameState,
					watcherCount,
					resumeVersion: (current?.resumeVersion ?? 0) + 1,
				}));
			},
			"game:host:resume:failed": ({ roomCode, message }) => {
				if (sessionStorage.getItem(HOST_ROOM_CODE_KEY) === roomCode) {
					sessionStorage.removeItem(HOST_ROOM_CODE_KEY);
					sessionStorage.removeItem(HOST_RESUME_TOKEN_KEY);
				}
				setIsResuming(false);
				setSession(null);
				setError(message);
			},
			"game:joined": ({ roomCode, gameState, watcherCount }) => {
				sessionStorage.removeItem(HOST_ROOM_CODE_KEY);
				sessionStorage.removeItem(HOST_RESUME_TOKEN_KEY);
				setSession({
					roomCode,
					role: "watcher",
					initialGameState: gameState,
					watcherCount,
				});
			},
			"game:watchers": ({ roomCode, watcherCount }) =>
				setSession((current) =>
					current?.roomCode === roomCode
						? { ...current, watcherCount }
						: current,
				),
			"game:error": ({ message }) => setError(message),
			"game:closed": ({ roomCode }) => {
				if (sessionStorage.getItem(HOST_ROOM_CODE_KEY) === roomCode) {
					sessionStorage.removeItem(HOST_ROOM_CODE_KEY);
					sessionStorage.removeItem(HOST_RESUME_TOKEN_KEY);
				}
				setSession((current) =>
					current?.roomCode === roomCode ? null : current,
				);
				setError("The game has ended.");
			},
		});

		return () => {
			unsubscribe();
			clientSocket.disconnect();
		};
	}, []);

	const createGame = () => {
		setError("");
		socket?.emit("game:create");
	};

	const joinGame = () => {
		const roomCode = prompt("Enter the game code:");
		if (roomCode?.trim()) {
			setError("");
			socket?.emit("game:join", { roomCode: roomCode.trim() });
		}
	};

	return (
		<div>
			<RoomStatus
				roomCode={session?.roomCode}
				watcherCount={session?.watcherCount}
			/>
			<h1>Family Feud</h1>
			{session ? (
				<GameRoom
					key={`${session.roomCode}-${session.resumeVersion ?? 0}`}
					roomCode={session.roomCode}
					role={session.role}
					socket={socket}
					initialGameState={session.initialGameState}
					watcherCount={session.watcherCount}
				/>
			) : (
				<>
					<p>
						{isResuming
							? "Restoring your game…"
							: connected
								? "Connected"
								: "Connecting to game server…"}
					</p>
					<button disabled={!connected || isResuming} onClick={createGame}>
						Create Game
					</button>
					<button disabled={!connected || isResuming} onClick={joinGame}>
						Join Game
					</button>
					{error && <p role="alert">{error}</p>}
				</>
			)}
		</div>
	);
}

export default App;
