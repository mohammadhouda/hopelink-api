import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dotenv from "dotenv";
import { registerRoomSocket } from "./sockets/room.socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

registerRoomSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
