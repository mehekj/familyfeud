export const createPublicGameState = (gameState) => {
    if (!gameState || !Array.isArray(gameState.questions)) return null;

    return {
        started: gameState.started === true,
        currentQuestionIndex: Number.isInteger(gameState.currentQuestionIndex)
            ? gameState.currentQuestionIndex
            : 0,
        questions: gameState.questions.map((question) => ({
            question:
                question?.questionRevealed === true &&
                    typeof question?.question === "string"
                    ? question.question
                    : null,
            questionRevealed: question?.questionRevealed === true,
            answers: Array.isArray(question?.answers)
                ? question.answers.map((answer) => {
                    const isRevealed = answer?.revealed === true;
                    return {
                        text:
                            isRevealed && typeof answer?.text === "string"
                                ? answer.text
                                : null,
                        points:
                            isRevealed && Number.isFinite(answer?.points)
                                ? answer.points
                                : null,
                        revealed: isRevealed,
                    };
                })
                : [],
        })),
    };
};

export const createRoomCode = (gameByRoomCode) => {
    let roomCode;
    do {
        roomCode = String(Math.floor(10_000_000 + Math.random() * 90_000_000));
    } while (gameByRoomCode.has(roomCode));
    return roomCode;
};

export const normalizeRoomCode = (roomCode) => String(roomCode ?? "").trim();
