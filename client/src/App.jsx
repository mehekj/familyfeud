import { useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

function App() {
	const socketRef = useRef(null);

	useEffect(() => {
		const socket = io();
		socketRef.current = socket;
		socket.on("connect", () => {
			console.log("Connected to server with ID:", socket.id);
		});
		return () => socket.disconnect();
	}, []);

	return (
		<div>
			<h1>Family Feud</h1>
			<button
				onClick={() => {
					const nickname = prompt("Enter your nickname:");
					if (nickname) {
						socketRef?.current.emit("new game", nickname);
					}
				}}
			>
				Start New Game
			</button>
		</div>
	);
}

export default App;
