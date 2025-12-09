import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";
import prisma from "../../config/prisma.js";
import eventBus from "../bus/event-bus.js";

interface AuthSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

class SocketService {
  private io: Server | null = null;

  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
    });

    // 1. Auth Middleware
    this.io.use((socket: AuthSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication error: Token required"));
        }

        const decoded: any = jwt.verify(token as string, env.JWT_SECRET);
        socket.user = { id: decoded.id, role: decoded.role };
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    // 2. Connection Logic
    this.io.on("connection", (socket: AuthSocket) => {
      const userId = socket.user!.id;
      logger.info(`[Socket] User connected: ${userId}`);

      // A. Join Personal Room (For Inbox Updates)
      socket.join(userId);

      // B. Join Chat Room (Explicit Action)
      socket.on("JOIN_ROOM", (roomId: string) => {
        logger.debug(`[Socket] User ${userId} joined room ${roomId}`);
        socket.join(roomId);
      });

      // C. Handle Messages
      socket.on("SEND_MESSAGE", async (payload) => {
        await this.handleMessage(socket, payload);
      });

      socket.on("disconnect", () => {
        // logger.debug(`[Socket] Disconnected: ${userId}`);
      });
    });

    logger.info("[INFO] Socket.IO Service Initialized");
  }

  private async handleMessage(socket: AuthSocket, payload: any) {
    const { roomId, content } = payload;
    const senderId = socket.user!.id;

    try {
      // 1. Validation: Ensure User belongs to Room
      // (Optional optimization: cache this check)
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: { id: true, tenantId: true, landlordId: true },
      });

      if (!room) {
        socket.emit("ERROR", { message: "Room not found" });
        return;
      }
      if (room.tenantId !== senderId && room.landlordId !== senderId) {
        socket.emit("ERROR", { message: "Unauthorized" });
        return;
      }

      // 2. Save to Database
      const message = await prisma.chatMessage.create({
        data: { roomId, senderId, content, isRead: false },
      });

      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { lastMessageAt: new Date() },
      });

      // 3. Broadcast to Chat Room (Active Screen)
      this.io?.to(roomId).emit("NEW_MESSAGE", message);

      // 4. [NEW] Broadcast to Receiver's Inbox (List Screen)
      const receiverId = senderId === room.tenantId ? room.landlordId : room.tenantId;
      
      this.io?.to(receiverId).emit("INBOX_UPDATE", {
        roomId: room.id,
        content: message.content,       // Snippet
        createdAt: message.createdAt,
        senderId: senderId,
      });

      // 5. Publish to Event Bus (Trust Engine & Push Notifs)
      eventBus.publish("CHAT:MESSAGE_SENT", {
        messageId: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

    } catch (error) {
      logger.error("[Socket] Message Error:", error);
      socket.emit("ERROR", { message: "Failed to send message" });
    }
  }

  /**
   * Helper to send generic real-time alerts
   */
  sendNotification(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }
}

export default new SocketService();