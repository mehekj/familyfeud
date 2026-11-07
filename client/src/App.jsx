import { useEffect, useRef, useState } from "react";
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
	const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
	const [joinRoomCode, setJoinRoomCode] = useState("");
	const suppressClosedErrorForRoom = useRef(null);

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
				if (suppressClosedErrorForRoom.current === roomCode) {
					suppressClosedErrorForRoom.current = null;
				} else {
					setError("The game has ended.");
				}
			},
		});

		return () => {
			unsubscribe();
			clientSocket.disconnect();
		};
	}, []);

	const returnToStart = (roomCode, role) => {
		setError("");
		if (role === "host") {
			suppressClosedErrorForRoom.current = roomCode;
			sessionStorage.removeItem(HOST_ROOM_CODE_KEY);
			sessionStorage.removeItem(HOST_RESUME_TOKEN_KEY);
			socket?.emit("game:end", { roomCode });
		}
		setSession(null);
	};

	const createGame = () => {
		setError("");
		socket?.emit("game:create");
	};

	const joinGame = () => {
		setJoinRoomCode("");
		setError("");
		setIsJoinDialogOpen(true);
	};

	const submitJoinGame = (event) => {
		event.preventDefault();
		const roomCode = joinRoomCode.trim();
		if (!roomCode) return;

		setError("");
		socket?.emit("game:join", { roomCode });
		setIsJoinDialogOpen(false);
	};

	return (
		<div
			className={
				session?.role === "watcher"
					? "app-shell app-shell--watcher"
					: "app-shell"
			}
		>
			<RoomStatus
				roomCode={session?.roomCode}
				watcherCount={session?.watcherCount}
			/>
			<h1 className="game-title">
				<span style={{ letterSpacing: "-0.15em" }}>Fa</span>mily Feud
			</h1>
			{session ? (
				<GameRoom
					key={`${session.roomCode}-${session.resumeVersion ?? 0}`}
					roomCode={session.roomCode}
					role={session.role}
					socket={socket}
					initialGameState={session.initialGameState}
					onReturnToStart={returnToStart}
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
					{isJoinDialogOpen && (
						<div className="join-dialog-backdrop">
							<section
								className="join-dialog"
								role="dialog"
								aria-modal="true"
								aria-labelledby="join-dialog-title"
							>
								<h2 id="join-dialog-title">Join a Game</h2>
								<form onSubmit={submitJoinGame}>
									<label htmlFor="join-room-code">Game code</label>
									<input
										autoFocus
										autoComplete="off"
										id="join-room-code"
										name="roomCode"
										value={joinRoomCode}
										onChange={(event) => setJoinRoomCode(event.target.value)}
										required
									/>
									<div className="join-dialog-actions">
										<button
											type="button"
											onClick={() => setIsJoinDialogOpen(false)}
										>
											Cancel
										</button>
										<button type="submit" disabled={!joinRoomCode.trim()}>
											Join Game
										</button>
									</div>
								</form>
							</section>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default App;
