import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";
import prisma from "../../config/prisma.js";
import eventBus from "../bus/event-bus.js";
import { chatQueue } from "../../modules/chat/chat.queue.js";

/**
 * Extended Socket Interface to include Authenticated User Data
 */
interface AuthSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

class SocketService {
  private io: Server | null = null;

  constructor() {
    this.registerEventSubscribers();
  }

  /**
   * Initialize the Socket.IO Server
   * @param httpServer The raw Node.js HTTP server instance
   */
  public init(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      transports: ["websocket", "polling"], // Force websocket for performance
    });

    // 1. Authentication Middleware
    this.io.use(this.authMiddleware);

    // 2. Connection Handler
    this.io.on("connection", (socket: AuthSocket) => {
      this.handleConnection(socket);
    });

    logger.info("[Socket] Service initialized with Redis Queue support");
  }

  /**
   * Middleware to verify JWT tokens on connection
   */
  private authMiddleware(socket: AuthSocket, next: (err?: Error) => void) {
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
      logger.warn(`[Socket] Auth failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      next(new Error("Authentication error: Invalid token"));
    }
  }

  /**
   * Handle individual client connections and event listeners
   */
  private handleConnection(socket: AuthSocket) {
    const userId = socket.user!.id;
    logger.info(`[Socket] Client connected: ${userId}`);

    // A. Join Personal Room (For Inbox/Notification updates)
    socket.join(userId);

    // B. Join Specific Chat Room
    socket.on("JOIN_ROOM", (roomId: string) => {
      logger.debug(`[Socket] User ${userId} joined room ${roomId}`);
      socket.join(roomId);
    });

    // C. Handle Incoming Messages (Async Handoff)
    socket.on("SEND_MESSAGE", async (payload) => {
      await this.handleIncomingMessage(socket, payload);
    });

    socket.on("disconnect", () => {
      logger.debug(`[Socket] Client disconnected: ${userId}`);
    });
  }

  /**
   * Processes incoming messages by pushing them to the Redis Queue.
   * This ensures the socket server remains responsive even under load.
   */
  private async handleIncomingMessage(socket: AuthSocket, payload: any) {
    const { roomId, content, tempId } = payload;
    const senderId = socket.user!.id;

    try {
      // 1. Lightweight Validation (Read-Optimized)
      // Note: We perform a DB read here to ensure security and identify the receiver.
      // In a hyper-scale environment, this room data should be cached in Redis.
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: { id: true, tenantId: true, landlordId: true },
      });

      if (!room) {
        socket.emit("ERROR", { message: "Room not found", tempId });
        return;
      }

      if (room.tenantId !== senderId && room.landlordId !== senderId) {
        socket.emit("ERROR", { message: "Unauthorized access to room", tempId });
        return;
      }

      // Determine the 'Other' person in the room
      const receiverId = senderId === room.tenantId ? room.landlordId : room.tenantId;

      // 2. Push to Queue (Fire & Forget)
      // We pass all necessary data so the worker doesn't need to look it up again.
      await chatQueue.add("processMessage", {
        roomId,
        senderId,
        receiverId,
        content,
        tempId,
      });

      // 3. Immediate Acknowledgment (Optimistic UI)
      // Tells the client "Server received your request" (Single Tick)
      socket.emit("MESSAGE_ACK", {
        tempId,
        status: "QUEUED",
        roomId,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error("[Socket] Failed to queue message:", error);
      socket.emit("ERROR", { message: "Server busy, please retry", tempId });
    }
  }

  /**
   * Listen for events from the Queue Worker to broadcast results
   */
  private registerEventSubscribers() {
    eventBus.subscribe("CHAT:MESSAGE_PROCESSED", (payload: any) => {
      const { message, roomId, receiverId, tempId } = payload;

      // 1. Broadcast to the Chat Room (Real-time update)
      // This updates the sender (Double Tick) and the receiver (if looking at the chat)
      this.io?.to(roomId).emit("NEW_MESSAGE", {
        ...message,
        tempId, // Client uses this to replace their optimistic message
      });

      // 2. Push Update to Receiver's Inbox (List View)
      this.io?.to(receiverId).emit("INBOX_UPDATE", {
        roomId,
        content: message.content,
        createdAt: message.createdAt,
        senderId: message.senderId,
        unreadCount: 1, // Client logic should handle incrementing this
      });

      // 3. Trigger Legacy Event (For Push Notifications / Trust Engine)
      eventBus.publish("CHAT:MESSAGE_SENT", {
        messageId: message.id,
        roomId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });
    });
  }

  /**
   * Helper to send generic real-time alerts to a specific user
   */
  public sendNotification(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }
}

export default new SocketService();