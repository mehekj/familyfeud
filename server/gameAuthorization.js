export const authorizeHostRoom = (clientSocket, game, roomCode) => {
    const isAuthorizedHost =
        game?.hostSocketId === clientSocket.id &&
        clientSocket.rooms.has(roomCode);

    if (!isAuthorizedHost) {
        clientSocket.emit("game:error", {
            message: "You are not the host of that game.",
        });
    }

    return isAuthorizedHost;
};