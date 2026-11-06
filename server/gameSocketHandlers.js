import { randomBytes, timingSafeEqual } from "node:crypto";
import {
    createPublicGameState,
    createRoomCode,
    normalizeRoomCode,
} from "./gameState.js";
import { authorizeHostRoom } from "./gameAuthorization.js";

const HOST_DISCONNECT_GRACE_PERIOD_MS = 3 * 60 * 1000;

export const registerGameSocketHandlers = (io) => {
    const gameByRoomCode = new Map();

    io.on("connection", (clientSocket) => {
        console.log("Socket connected:", clientSocket.id);

        clientSocket.on("game:create", () => {
            const roomCode = createRoomCode(gameByRoomCode);
            gameByRoomCode.set(roomCode, {
                hostSocketId: clientSocket.id,
                hostResumeToken: randomBytes(32).toString("hex"),
                hostGameState: null,
                publicGameState: null,
                watcherSocketIds: new Set(),
                hostDisconnectTimeout: null,
            });
            clientSocket.join(roomCode);
            clientSocket.emit("game:created", {
                roomCode,
                resumeToken: gameByRoomCode.get(roomCode).hostResumeToken,
            });
            console.log(`Game created: ${roomCode}`);
        });

        clientSocket.on(
            "game:host:resume",
            ({ roomCode: requestedRoomCode, resumeToken } = {}) => {
                const roomCode = normalizeRoomCode(requestedRoomCode);
                const game = gameByRoomCode.get(roomCode);
                const expectedToken = game?.hostResumeToken;
                const tokenMatches =
                    typeof resumeToken === "string" &&
                    typeof expectedToken === "string" &&
                    resumeToken.length === expectedToken.length &&
                    timingSafeEqual(
                        Buffer.from(resumeToken),
                        Buffer.from(expectedToken),
                    );

                if (!tokenMatches) {
                    clientSocket.emit("game:host:resume:failed", {
                        roomCode,
                        message:
                            "Could not restore the host session. The game may have expired.",
                    });
                    return;
                }

                clearTimeout(game.hostDisconnectTimeout);
                game.hostDisconnectTimeout = null;
                game.hostSocketId = clientSocket.id;
                clientSocket.join(roomCode);
                clientSocket.emit("game:host:resumed", {
                    roomCode,
                    gameState: game.hostGameState,
                    watcherCount: game.watcherSocketIds.size,
                });
                console.log(`Host resumed game: ${roomCode}`);
            },
        );

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

                game.hostGameState = gameState;
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

        clientSocket.on("game:end", ({ roomCode: requestedRoomCode } = {}) => {
            const roomCode = normalizeRoomCode(requestedRoomCode);
            const game = gameByRoomCode.get(roomCode);

            if (!authorizeHostRoom(clientSocket, game, roomCode)) return;

            clearTimeout(game.hostDisconnectTimeout);
            gameByRoomCode.delete(roomCode);
            io.to(roomCode).emit("game:closed", { roomCode });
            console.log(`Game ended by host: ${roomCode}`);
        });

        clientSocket.on("disconnecting", () => {
            for (const roomCode of clientSocket.rooms) {
                const game = gameByRoomCode.get(roomCode);
                if (game?.hostSocketId === clientSocket.id) {
                    game.hostDisconnectTimeout = setTimeout(() => {
                        if (gameByRoomCode.get(roomCode) !== game) return;

                        gameByRoomCode.delete(roomCode);
                        io.to(roomCode).emit("game:closed", { roomCode });
                        console.log(
                            `Host disconnect grace period expired; game closed: ${roomCode}`,
                        );
                    }, HOST_DISCONNECT_GRACE_PERIOD_MS);
                    console.log(
                        `Host disconnected; game will close in 3 minutes: ${roomCode}`,
                    );
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