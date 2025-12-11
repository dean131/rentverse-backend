import prisma from "../../config/prisma.js";
import { CreateDisputeInput } from "./dispute.schema.js";

class DisputeRepository {
  async findBookingById(bookingId: string) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { select: { landlordId: true } },
      },
    });
  }

  async create(userId: string, bookingId: string, data: CreateDisputeInput) {
    return await prisma.dispute.create({
      data: {
        bookingId,
        initiatorId: userId,
        reason: data.reason,
        description: data.description,
        status: "OPEN",
      },
    });
  }

  /**
   * Find all disputes for Admin List
   */
  async findAll(filters: { status?: string }) {
    return await prisma.dispute.findMany({
      where: filters.status ? { status: filters.status } : undefined,
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            property: { select: { title: true } },
          },
        },
        initiator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find single dispute with full context (needed for resolution logic)
   */
  async findById(disputeId: string) {
    return await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            property: { select: { landlordId: true } },
          },
        },
      },
    });
  }

  /**
   * Resolve Dispute
   */
  async resolve(
    disputeId: string,
    adminId: string,
    data: {
      status: string;
      resolution: string;
      adminNotes: string;
    }
  ) {
    return await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: data.status,
        resolution: data.resolution,
        adminNotes: data.adminNotes,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Find disputes initiated by a specific user
   */
  async findByInitiator(userId: string) {
    return await prisma.dispute.findMany({
      where: { initiatorId: userId },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            property: { select: { title: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new DisputeRepository();
