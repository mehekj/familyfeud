import { useEffect, useState } from "react";
import io from "socket.io-client";
import GameRoom from "./GameRoom";
import { subscribeSocketEvents } from "./socketEvents";

function App() {
	const [socket, setSocket] = useState(null);
	const [connected, setConnected] = useState(false);
	const [session, setSession] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		const clientSocket = io();

		const unsubscribe = subscribeSocketEvents(clientSocket, {
			connect: () => {
				setSocket(clientSocket);
				setConnected(true);
			},
			disconnect: () => setConnected(false),
			"game:created": ({ roomCode }) =>
				setSession({ roomCode, role: "host", watcherCount: 0 }),
			"game:joined": ({ roomCode, gameState, watcherCount }) =>
				setSession({
					roomCode,
					role: "watcher",
					initialGameState: gameState,
					watcherCount,
				}),
			"game:error": ({ message }) => setError(message),
			"game:closed": ({ roomCode }) => {
				setSession((current) =>
					current?.roomCode === roomCode ? null : current,
				);
				setError("The host ended the game.");
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
			<h1>Family Feud</h1>
			{session ? (
				<GameRoom
					roomCode={session.roomCode}
					role={session.role}
					socket={socket}
					initialGameState={session.initialGameState}
					initialWatcherCount={session.watcherCount}
				/>
			) : (
				<>
					<p>{connected ? "Connected" : "Connecting to game server…"}</p>
					<button disabled={!connected} onClick={createGame}>
						Create Game
					</button>
					<button disabled={!connected} onClick={joinGame}>
						Join Game
					</button>
					{error && <p role="alert">{error}</p>}
				</>
			)}
		</div>
	);
}

export default App;
