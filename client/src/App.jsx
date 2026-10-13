import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";
import Host from "./Host";
import Watch from "./Watch";

function App() {
	const socketRef = useRef(null);
	const [hosting, setHosting] = useState(0);
	const [watching, setWatching] = useState(0);

	useEffect(() => {
		const socket = io();
		socketRef.current = socket;

		socket.on("connect", () => {
			console.log("Connected to server with ID:", socket.id);
		});

		socket.on("host joined", (data) => {
			console.log(`Host created game ${data.room}`);
			setHosting(data.room);
		});

		socket.on("new joined", (data) => {
			console.log(`Player joined game ${data.room}`);
			setWatching(data.room);
		});

		return () => {
			setHosting(0);
			setWatching(0);
			socket.disconnect();
		};
	}, []);

	return (
		<div>
			<h1>Family Feud</h1>
			{hosting ? (
				<Host room={hosting} socket={socketRef} />
			) : watching ? (
				<Watch room={watching} socket={socketRef} />
			) : (
				<>
					<button
						onPointerDown={() => {
							socketRef.current.emit("new game");
						}}
					>
						Start New Game
					</button>
					<button
						onPointerDown={() => {
							const room = prompt("Enter the game code:");
							if (room) {
								socketRef.current.emit("join game", room);
							}
						}}
					>
						Join Game
					</button>
				</>
			)}
		</div>
	);
}

export default App;
