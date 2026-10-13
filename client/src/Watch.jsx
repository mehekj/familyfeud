import { useEffect, useState } from "react";

export default function Watch(props) {
	const [gameData, setGameData] = useState([]);
	const [gameStarted, setGameStarted] = useState(false);
	const [questionIndex, setQuestionIndex] = useState(0);

	useEffect(() => {
		const socket = props.socket?.current;

		socket.on("game started", (data) => {
			console.log("Starting game", data);
			setGameData(
				data.map((question) => ({
					question: question.question,
					answers: question.answers.map((answer) => ({
						answer: answer.answer,
						points: answer.points,
						revealed: false,
					})),
				})),
			);
			setGameStarted(true);
		});

		socket.on("answer revealed", (data) => {
			console.log("Revealing answer", data);
			setGameData((prevGameData) => {
				const newGameData = [...prevGameData];
				newGameData[data.questionIndex].answers[data.answerIndex].revealed =
					true;
				return newGameData;
			});
		});

		socket.on("next question", (data) => {
			console.log("Next question", data);
			setQuestionIndex((prevIndex) => prevIndex + 1);
		});

		return () => {
			socket.off("game started");
			socket.off("answer revealed");
			socket.off("next question");
		};
	}, [props.room, props.socket]);

	return (
		<div>
			{gameStarted ? (
				<div>
					{gameData[questionIndex] && (
						<div>
							<h2>{gameData[questionIndex].question}</h2>
							<ul>
								{gameData[questionIndex].answers.map((answer, i) => (
									<li key={i}>
										{answer.revealed
											? `${answer.answer} - ${answer.points} points`
											: "???"}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			) : (
				<div>welcome watcher {props.room}</div>
			)}
		</div>
	);
}
