import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const buildPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5050;

const server = http.createServer(app);
const io = new Server(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let games = {};

io.on('connection', (socket) => {
    console.log('A user connected with ID:', socket.id);

    socket.on('new game', (nickname) => {
        const rooms = io.sockets.adapter.rooms;
        let room = 0;
        do {
            room = Math.floor(Math.random() * 100000000);
        }
        while (rooms.get(room) != undefined);
        socket.join(room);
        games[room] = {};
        io.to(room).emit('new joined', { nickname: nickname, room: room, player: io.sockets.adapter.rooms.get(room).length });
        console.log(`Player ${nickname} created room ${room}`);
    });

    socket.on('join game', (data) => {
        let room = data.room;
        if (!(io.sockets.adapter.rooms.get(room)) || !(games[room])) {
            socket.emit('login error', 'Invalid room code');
            console.log(`Player ${data.nickname} tried to join invalid room ${room}`);
        }
        else {
            socket.join(room);
            io.to(room).emit('new joined', { nickname: data.nickname, room: room, player: io.sockets.adapter.rooms.get(room).length });
            console.log(`Player ${data.nickname} joined room ${room}`);
        }
    });

    socket.on('disconnecting', (reason) => {
        if (Object.keys(socket.rooms)[0]) {
            room = Object.keys(socket.rooms)[0];
            delete games[room];
            io.to(room).emit('user left');
            console.log(`Player ${socket.id} left room ${room}`);
        }
    });
});