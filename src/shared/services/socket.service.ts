import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";
import prisma from "../../config/prisma.js";

// Types for Socket Data
interface AuthSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

class SocketService {
  private io: Server | null = null;

  /**
   * Initialize Socket.IO attached to the HTTP Server
   */
  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*", // Allow all origins for mobile apps
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
    });

    // 1. Authentication Middleware
    this.io.use(async (socket: AuthSocket, next) => {
      try {
        // Support token in Auth Header or Handshake Auth object
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
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

    // 2. Connection Handler
    this.io.on("connection", (socket: AuthSocket) => {
      const userId = socket.user!.id;
      logger.info(`[Socket] User connected: ${userId}`);

      // Join a private room for the user (for direct notifications)
      socket.join(userId);

      // Handle Joining a Specific Chat Room
      socket.on("JOIN_ROOM", (roomId: string) => {
        logger.debug(`[Socket] User ${userId} joined room ${roomId}`);
        socket.join(roomId);
      });

      // Handle Sending Messages
      socket.on("SEND_MESSAGE", async (payload) => {
        await this.handleMessage(socket, payload);
      });

      socket.on("disconnect", () => {
        // logger.debug(`[Socket] Disconnected: ${userId}`);
      });
    });

    logger.info("[INFO] Socket.IO Service Initialized");
  }

  /**
   * Handle Incoming Message Event
   */
  private async handleMessage(socket: AuthSocket, payload: any) {
    const { roomId, content } = payload;
    const senderId = socket.user!.id;

    try {
      // A. Save to Database
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          senderId,
          content,
          isRead: false,
        },
      });

      // B. Update Room "Last Message" timestamp (for sorting list)
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { lastMessageAt: new Date() },
      });

      // C. Broadcast to everyone in the room (including sender for confirmation)
      this.io?.to(roomId).emit("NEW_MESSAGE", message);

      // D. Optional: Send Push Notification to offline users here (Phase 6)

    } catch (error) {
      logger.error("[Socket] Message Error:", error);
      socket.emit("ERROR", { message: "Failed to send message" });
    }
  }

  /**
   * Public method to send notifications from other modules (e.g., BookingService)
   */
  sendNotification(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }
}

export default new SocketService();