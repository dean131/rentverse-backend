import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

class ChatRepository {
  /**
   * Helper: Check if property exists
   */
  async findPropertyLink(propertyId: string) {
    return await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, landlordId: true },
    });
  }

  /**
   * Find existing room
   */
  async findRoom(tenantId: string, landlordId: string, propertyId: string) {
    return await prisma.chatRoom.findFirst({
      where: {
        tenantId,
        landlordId,
        propertyId,
      },
    });
  }

  /**
   * Create a new Chat Room
   */
  async createRoom(tenantId: string, landlordId: string, propertyId: string) {
    return await prisma.chatRoom.create({
      data: {
        tenantId,
        landlordId,
        propertyId,
        lastMessageAt: new Date(),
      },
    });
  }

  /**
   * Get Room by ID
   */
  async findRoomById(roomId: string) {
    return await prisma.chatRoom.findUnique({ where: { id: roomId } });
  }

  /**
   * List all conversations with Cursor Pagination.
   */
  async findMyRooms(userId: string, role: string, limit: number, cursor?: string) {
    const where: Prisma.ChatRoomWhereInput =
      role === "TENANT" ? { tenantId: userId } : { landlordId: userId };

    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    return await prisma.chatRoom.findMany({
      where,
      take: limit,
      skip,
      cursor: cursorObj,
      orderBy: { lastMessageAt: "desc" }, // Most recent chat first
      include: {
        tenant: role === "LANDLORD" ? { select: { name: true, avatarUrl: true } } : false,
        landlord: role === "TENANT" ? { select: { name: true, avatarUrl: true } } : false,
        property: { select: { id: true, title: true, city: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Count total conversations for a user.
   */
  async countMyRooms(userId: string, role: string) {
    const where: Prisma.ChatRoomWhereInput =
      role === "TENANT" ? { tenantId: userId } : { landlordId: userId };

    return await prisma.chatRoom.count({ where });
  }

  /**
   * Fetch messages with Cursor Pagination
   */
  async findMessages(roomId: string, limit: number, cursor?: string) {
    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    return await prisma.chatMessage.findMany({
      where: { roomId },
      take: limit,
      skip,
      cursor: cursorObj,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * [NEW] Count total messages in a room
   */
  async countMessages(roomId: string) {
    return await prisma.chatMessage.count({
      where: { roomId },
    });
  }
}

export default new ChatRepository();