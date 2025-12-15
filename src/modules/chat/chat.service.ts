import chatRepository from "./chat.repository.js";
import AppError from "../../shared/utils/AppError.js";
import { env } from "../../config/env.js";
import storageService from "../../shared/services/storage.service.js";

class ChatService {

  async startChat(tenantId: string, propertyId: string) {
    const property = await chatRepository.findPropertyLink(propertyId);

    if (!property) throw new AppError("Property not found", 404);
    if (property.landlordId === tenantId)
      throw new AppError("Cannot chat with yourself", 400);

    let room = await chatRepository.findRoom(
      tenantId,
      property.landlordId,
      propertyId
    );

    if (!room) {
      room = await chatRepository.createRoom(
        tenantId,
        property.landlordId,
        propertyId
      );
    }

    return { roomId: room.id };
  }

  /**
   * Get Conversation List (Inbox) with Pagination.
   */
  async getMyConversations(userId: string, role: string, query: any) {
    const limit = Number(query.limit) || 20;
    const cursor = query.cursor as string | undefined;

    // Run Fetch and Count in parallel
    const [rooms, total] = await Promise.all([
      chatRepository.findMyRooms(userId, role, limit, cursor),
      chatRepository.countMyRooms(userId, role),
    ]);

    // Determine Next Cursor
    let nextCursor: string | null = null;
    if (rooms.length === limit) {
      nextCursor = rooms[rooms.length - 1].id;
    }

    // Transform Data
    const data = rooms.map((room) => {
      const otherPerson = role === "TENANT" ? room.landlord : room.tenant;
      const lastMsg = room.messages[0];

      return {
        id: room.id,
        property: {
          id: room.property?.id,
          title: room.property?.title,
          city: room.property?.city,
        },
        otherUser: {
          name: otherPerson?.name || "Unknown",
          avatarUrl: storageService.getPublicUrl(otherPerson?.avatarUrl),
        },
        lastMessage: lastMsg ? lastMsg.content : "Start the conversation!",
        lastMessageAt: room.lastMessageAt,
      };
    });

    return {
      data,
      meta: {
        total,
        limit,
        nextCursor,
        hasMore: !!nextCursor,
      },
    };
  }

  /**
   * Get Messages with Total Count
   */
  async getRoomMessages(roomId: string, userId: string, query: any) {
    const room = await chatRepository.findRoomById(roomId);
    if (!room) throw new AppError("Chat room not found", 404);

    if (room.tenantId !== userId && room.landlordId !== userId) {
      throw new AppError("Unauthorized access to this chat", 403);
    }

    const limit = Number(query.limit) || 50;
    const cursor = query.cursor as string | undefined;

    //  Run Fetch and Count in parallel
    const [messages, total] = await Promise.all([
      chatRepository.findMessages(roomId, limit, cursor),
      chatRepository.countMessages(roomId),
    ]);

    let nextCursor: string | null = null;
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].id;
    }

    const data = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      isMe: msg.senderId === userId,
      createdAt: msg.createdAt,
    }));

    return {
      data,
      meta: {
        total, //  Added to satisfy interface
        limit,
        nextCursor,
        hasMore: !!nextCursor,
      },
    };
  }
}

export default new ChatService();
