import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { registerGameSocketHandlers } from "./gameSocketHandlers.js";

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

registerGameSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
