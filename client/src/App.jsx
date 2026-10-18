import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";
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
			"game:created": ({ room }) => setSession({ room, role: "host" }),
			"game:joined": ({ room, state }) =>
				setSession({ room, role: "watcher", initialState: state }),
			"game:error": ({ message }) => setError(message),
			"game:closed": ({ room }) => {
				setSession((current) => (current?.room === room ? null : current));
				setError("The host ended the game.");
			},
		});

		return () => {
			unsubscribe();
			clientSocket.disconnect();
		};
	}, []);

	var createGame = () => {
		setError("");
		socket?.emit("game:create");
	};

	var joinGame = () => {
		const room = prompt("Enter the game code:");
		if (room?.trim()) {
			setError("");
			socket?.emit("game:join", { room: room.trim() });
		}
	};

	return (
		<div>
			<h1>Family Feud</h1>
			{session ? (
				<GameRoom
					room={session.room}
					role={session.role}
					socket={socket}
					initialState={session.initialState}
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
