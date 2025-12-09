import prisma from "../../config/prisma.js";

class LandlordRepository {
  /**
   * Fetch core business metrics for the dashboard.
   */
  async getDashboardStats(landlordId: string) {
    const [profile, wallet, activeBookings, totalProperties, pendingRequests] = await Promise.all([
      prisma.landlordTrustProfile.findUnique({
        where: { userRefId: landlordId },
        select: { lrs_score: true, response_rate: true },
      }),
      prisma.wallet.findUnique({
        where: { userId: landlordId },
        select: { balance: true, currency: true },
      }),
      prisma.booking.count({
        where: { property: { landlordId }, status: "ACTIVE" },
      }),
      prisma.property.count({
        where: { landlordId, deletedAt: null },
      }),
      prisma.booking.count({
        where: { property: { landlordId }, status: "PENDING_PAYMENT" },
      })
    ]);

    return { profile, wallet, activeBookings, totalProperties, pendingRequests };
  }

  /**
   * [NEW] Fetch Landlord's Inventory (Private View)
   * Includes stats like total bookings per property.
   */
  async findMyProperties(landlordId: string, limit: number, cursor?: string, search?: string) {
    const where: any = {
      landlordId,
      deletedAt: null,
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    const [total, properties] = await prisma.$transaction([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        take: limit,
        skip,
        cursor: cursorObj,
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
          propertyType: { select: { label: true } },
          listingType: { select: { label: true } },
          _count: {
            select: { bookings: true }, // Booking stats
          },
        },
      }),
    ]);

    return { total, properties };
  }
}

export default new LandlordRepository();