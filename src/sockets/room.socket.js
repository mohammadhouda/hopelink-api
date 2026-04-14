import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export function registerRoomSocket(io) {
  // JWT auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id, isActive: true },
        select: { id: true, name: true, role: true },
      });

      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    // Join a room by opportunityId
    socket.on("join_room", async ({ opportunityId }) => {
      try {
        const parsedOpportunityId = parseInt(opportunityId);
        if (!parsedOpportunityId) {
          return socket.emit("error", { message: "Invalid opportunityId" });
        }

        const room = await prisma.volunteerRoom.findUnique({
          where: { opportunityId: parsedOpportunityId },
          include: { opportunity: { select: { charityId: true } } },
        });

        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        if (room.status === "CLOSED") {
          return socket.emit("error", { message: "This room is closed" });
        }

        // ── Enforce access based on role ──────────────────────────────────
        if (user.role === "CHARITY") {
          // Charity must own this opportunity
          const charityAccount = await prisma.charityAccount.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });

          if (
            !charityAccount ||
            charityAccount.id !== room.opportunity.charityId
          ) {
            return socket.emit("error", {
              message: "Access denied: this is not your opportunity",
            });
          }
        } else if (user.role === "USER") {
          // Volunteer must have an approved application for this specific opportunity
          const approvedApplication =
            await prisma.opportunityApplication.findUnique({
              where: {
                userId_opportunityId: {
                  userId: user.id,
                  opportunityId: parsedOpportunityId,
                },
              },
              select: { status: true },
            });

          if (!approvedApplication) {
            return socket.emit("error", {
              message:
                "Access denied: you have not applied to this opportunity",
            });
          }

          if (approvedApplication.status !== "APPROVED") {
            return socket.emit("error", {
              message: "Access denied: your application has not been approved",
            });
          }
        } else {
          return socket.emit("error", {
            message: "Access denied: your role cannot join volunteer rooms",
          });
        }

        const roomKey = `room:${room.id}`;
        socket.join(roomKey);
        socket.currentRoom = roomKey;
        socket.currentRoomId = room.id;

        socket.emit("joined_room", {
          roomId: room.id,
          opportunityId: parsedOpportunityId,
        });

        socket.to(roomKey).emit("user_joined", {
          userId: user.id,
          name: user.name,
        });
      } catch {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Send a message
    socket.on("send_message", async ({ content }) => {
      try {
        if (!socket.currentRoomId) {
          return socket.emit("error", {
            message: "You must join a room first",
          });
        }

        if (!content?.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        // Verify room is still active
        const room = await prisma.volunteerRoom.findUnique({
          where: { id: socket.currentRoomId },
          select: { status: true },
        });

        if (!room || room.status === "CLOSED") {
          return socket.emit("error", { message: "This room is closed" });
        }

        const message = await prisma.roomMessage.create({
          data: {
            roomId: socket.currentRoomId,
            senderId: user.id,
            content: content.trim(),
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                baseProfile: { select: { avatarUrl: true } },
              },
            },
          },
        });

        // Broadcast to all in room including sender
        io.to(socket.currentRoom).emit("new_message", message);
      } catch {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Leave room
    socket.on("leave_room", () => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("user_left", {
          userId: user.id,
          name: user.name,
        });
        socket.leave(socket.currentRoom);
        socket.currentRoom = null;
        socket.currentRoomId = null;
      }
    });

    // Typing indicator
    socket.on("typing", ({ isTyping }) => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("user_typing", {
          userId: user.id,
          name: user.name,
          isTyping,
        });
      }
    });

    socket.on("disconnect", () => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("user_left", {
          userId: user.id,
          name: user.name,
        });
      }
    });
  });
}
