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

const gameData = [
    {
        question: "name something that gets forwarded in the whatsapp group",
        answers: [
            { answer: "jokes", points: 30 },
            { answer: "memes", points: 25 },
            { answer: "videos", points: 20 },
            { answer: "messages", points: 15 },
            { answer: "photos", points: 10 },
        ],
    },
    {
        question: "name something you'd never pay full price for",
        answers: [
            { answer: "clothes", points: 30 },
            { answer: "electronics", points: 25 },
            { answer: "furniture", points: 20 },
            { answer: "toys", points: 15 },
            { answer: "shoes", points: 10 },
        ],
    },
];

io.on("connection", (socket) => {
    console.log("A user connected with ID:", socket.id);

    socket.on("new game", () => {
        const rooms = io.sockets.adapter.rooms;
        let room = 0;
        do {
            room = Math.floor(Math.random() * 100000000);
        } while (rooms.get(room) != undefined);
        socket.join(room);
        games[room] = {};
        io.to(room).emit("host joined", { room: room });
        console.log(`Host created game ${room}`);
    });

    socket.on("join game", (roomStr) => {
        const room = Number(roomStr);
        if (!room || !io.sockets.adapter.rooms.get(room) || !games[room]) {
            socket.emit("login error", "Invalid game code");
            console.log(`Player tried to join invalid game ${room}`);
        } else {
            socket.join(room);
            io.to(room).emit("new joined", {
                room: room,
                player: io.sockets.adapter.rooms.get(room).length,
            });
            console.log(`Player joined game ${room}`);
        }
    });

    socket.on("start game", (roomStr) => {
        const room = Number(roomStr);
        if (!room || !io.sockets.adapter.rooms.get(room) || !games[room]) {
            socket.emit("event error", "Invalid game code");
            console.log(`Player tried to start invalid game ${room}`);
        } else {
            io.to(room).emit("game started", gameData);
            console.log(`Game started in room ${room}`);
        }
    });

    socket.on("reveal answer", (data) => {
        const room = Number(data.room);
        if (!room || !io.sockets.adapter.rooms.get(room) || !games[room]) {
            socket.emit("event error", "Invalid game code");
            console.log(`Player tried to reveal answer in invalid game ${room}`);
        } else {
            io.to(room).emit("answer revealed", {
                questionIndex: data.questionIndex,
                answerIndex: data.answerIndex,
            });
            console.log(
                `Answer revealed in room ${room} for question ${data.questionIndex} and answer ${data.answerIndex}`,
            );
        }
    });

    socket.on("goto next question", (data) => {
        const room = Number(data.room);
        if (!room || !io.sockets.adapter.rooms.get(room) || !games[room]) {
            socket.emit("event error", "Invalid game code");
            console.log(`Player tried to go to next question in invalid game ${room}`);
        } else {
            io.to(room).emit("next question", {
                questionIndex: data.questionIndex,
            });
            console.log(`Next question emitted in room ${room}`);
        }
    });

    socket.on("disconnecting", (reason) => {
        console.log(`User with ID ${socket.id} is disconnecting. Reason: ${reason}`);
        if (Object.keys(socket.rooms)[0]) {
            room = Object.keys(socket.rooms)[0];
            delete games[room];
            io.to(room).emit("user left");
        }
    });
});
