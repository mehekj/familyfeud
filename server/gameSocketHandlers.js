var createPublicGameState = (gameState) => {
    if (!gameState || !Array.isArray(gameState.questions)) {
        return null;
    }

    return {
        started: gameState.started === true,
        currentQuestionIndex: Number.isInteger(gameState.currentQuestionIndex)
            ? gameState.currentQuestionIndex
            : 0,
        questions: gameState.questions.map((question) => ({
            question:
                typeof question?.question === "string" ? question.question : "",
            answers: Array.isArray(question?.answers)
                ? question.answers.map((answer) => {
                    const revealed = answer?.revealed === true;
                    return {
                        text:
                            revealed && typeof answer?.text === "string" ? answer.text : null,
                        points:
                            revealed && Number.isFinite(answer?.points)
                                ? answer.points
                                : null,
                        revealed,
                    };
                })
                : [],
        })),
    };
};

var createRoomCode = (games) => {
    let room;
    do {
        room = String(Math.floor(10000000 + Math.random() * 90000000));
    } while (games.has(room));
    return room;
};

export var registerGameSocketHandlers = (io) => {
    const games = new Map();

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("game:create", () => {
            const room = createRoomCode(games);
            games.set(room, { hostId: socket.id, publicState: null });
            socket.join(room);
            socket.emit("game:created", { room });
            console.log(`Game created: ${room}`);
        });

        socket.on("game:join", ({ room: requestedRoom } = {}) => {
            const room = String(requestedRoom ?? "").trim();
            const game = games.get(room);

            if (!game || game.hostId === socket.id) {
                socket.emit("game:error", { message: "Invalid game code." });
                return;
            }

            socket.join(room);
            socket.emit("game:joined", { room, state: game.publicState });
            io.to(room).except(socket.id).emit("game:player-joined", { room });
            console.log(`Socket ${socket.id} joined game ${room}`);
        });

        socket.on("game:publish", ({ room: requestedRoom, state } = {}) => {
            const room = String(requestedRoom ?? "").trim();
            const game = games.get(room);
            const publicState = createPublicGameState(state);

            if (!game || game.hostId !== socket.id || !socket.rooms.has(room)) {
                socket.emit("game:error", { message: "You are not the host of that game." });
                return;
            }
            if (!publicState) {
                socket.emit("game:error", { message: "The game state is invalid." });
                return;
            }

            game.publicState = publicState;
            socket.to(room).emit("game:state", { room, state: publicState });
        });

        socket.on("disconnecting", () => {
            for (const room of socket.rooms) {
                const game = games.get(room);
                if (game?.hostId === socket.id) {
                    games.delete(room);
                    socket.to(room).emit("game:closed", { room });
                    console.log(`Host disconnected; game closed: ${room}`);
                }
            }
        });
    });
};