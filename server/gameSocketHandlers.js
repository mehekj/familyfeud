import {
    createPublicGameState,
    createRoomCode,
    normalizeRoomCode,
} from "./gameState.js";
import { authorizeHostRoom } from "./gameAuthorization.js";

export const registerGameSocketHandlers = (io) => {
    const gameByRoomCode = new Map();

    io.on("connection", (clientSocket) => {
        console.log("Socket connected:", clientSocket.id);

        clientSocket.on("game:create", () => {
            const roomCode = createRoomCode(gameByRoomCode);
            gameByRoomCode.set(roomCode, {
                hostSocketId: clientSocket.id,
                publicGameState: null,
                watcherSocketIds: new Set(),
            });
            clientSocket.join(roomCode);
            clientSocket.emit("game:created", { roomCode });
            console.log(`Game created: ${roomCode}`);
        });

        clientSocket.on("game:join", ({ roomCode: requestedRoomCode } = {}) => {
            const roomCode = normalizeRoomCode(requestedRoomCode);
            const game = gameByRoomCode.get(roomCode);

            if (!game || game.hostSocketId === clientSocket.id) {
                clientSocket.emit("game:error", { message: "Invalid game code." });
                return;
            }

            clientSocket.join(roomCode);
            game.watcherSocketIds.add(clientSocket.id);
            clientSocket.emit("game:joined", {
                roomCode,
                gameState: game.publicGameState,
                watcherCount: game.watcherSocketIds.size,
            });
            io.to(roomCode).emit("game:watchers", {
                roomCode,
                watcherCount: game.watcherSocketIds.size,
            });
            console.log(`Socket ${clientSocket.id} joined game ${roomCode}`);
        });

        clientSocket.on(
            "game:publish",
            ({ roomCode: requestedRoomCode, gameState } = {}) => {
                const roomCode = normalizeRoomCode(requestedRoomCode);
                const game = gameByRoomCode.get(roomCode);
                const publicGameState = createPublicGameState(gameState);

                if (!authorizeHostRoom(clientSocket, game, roomCode)) return;
                if (!publicGameState) {
                    clientSocket.emit("game:error", {
                        message: "The game state is invalid.",
                    });
                    return;
                }

                game.publicGameState = publicGameState;
                clientSocket.to(roomCode).emit("game:state", {
                    roomCode,
                    gameState: publicGameState,
                });
            },
        );

        clientSocket.on(
            "game:timer:start",
            ({ roomCode: requestedRoomCode, timerLengthSeconds } = {}) => {
                const roomCode = normalizeRoomCode(requestedRoomCode);
                const game = gameByRoomCode.get(roomCode);

                if (!authorizeHostRoom(clientSocket, game, roomCode)) return;
                if (!Number.isFinite(timerLengthSeconds) || timerLengthSeconds <= 0) {
                    clientSocket.emit("game:error", {
                        message: "Timer length must be a positive number.",
                    });
                    return;
                }

                io.to(roomCode).emit("game:timer:started", {
                    roomCode,
                    timerLengthSeconds,
                });
            },
        );

        clientSocket.on(
            "game:timer:stop",
            ({ roomCode: requestedRoomCode } = {}) => {
                const roomCode = normalizeRoomCode(requestedRoomCode);
                const game = gameByRoomCode.get(roomCode);

                if (!authorizeHostRoom(clientSocket, game, roomCode)) return;

                io.to(roomCode).emit("game:timer:stopped", { roomCode });
            },
        );

        clientSocket.on("disconnecting", () => {
            for (const roomCode of clientSocket.rooms) {
                const game = gameByRoomCode.get(roomCode);
                if (game?.hostSocketId === clientSocket.id) {
                    gameByRoomCode.delete(roomCode);
                    clientSocket.to(roomCode).emit("game:closed", { roomCode });
                    console.log(`Host disconnected; game closed: ${roomCode}`);
                } else if (game?.watcherSocketIds.delete(clientSocket.id)) {
                    io.to(roomCode).emit("game:watchers", {
                        roomCode,
                        watcherCount: game.watcherSocketIds.size,
                    });
                }
            }
        });
    });
};