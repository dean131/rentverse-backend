import landlordRepository from "./landlord.repository.js";
import { env } from "../../config/env.js";

class LandlordService {
  private transformUrl(url: string) {
    return url.startsWith("http") ? url : `${env.MINIO_URL}/${url}`;
  }

  async getDashboard(landlordId: string) {
    const stats = await landlordRepository.getDashboardStats(landlordId);

    const balance = stats.wallet ? Number(stats.wallet.balance) : 0;
    const currency = stats.wallet?.currency || "IDR";
    const lrsScore = stats.profile?.lrs_score || 50.0;
    const responseRate = stats.profile?.response_rate || 0;

    return {
      overview: {
        totalIncome: { amount: balance, currency, label: "Wallet Balance" },
        occupancy: { active: stats.activeBookings, pending: stats.pendingRequests, label: "Active Bookings" },
        trust: { score: lrsScore, responseRate, label: "LRS Score" },
        inventory: { total: stats.totalProperties, label: "Listed Properties" },
      },
    };
  }

  /**
   * [NEW] Get Inventory List
   */
  async getInventory(landlordId: string, query: any) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as string | undefined;
    const search = query.search as string | undefined;

    const { total, properties } = await landlordRepository.findMyProperties(landlordId, limit, cursor, search);

    let nextCursor: string | null = null;
    if (properties.length === limit) {
      nextCursor = properties[properties.length - 1].id;
    }

    const data = properties.map((p) => {
      let imageUrl = null;
      if (p.images.length > 0) {
        imageUrl = this.transformUrl(p.images[0].url);
      }

      return {
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        price: Number(p.price),
        currency: p.currency,
        isVerified: p.isVerified, // Important for Landlord to know status
        image: imageUrl,
        type: p.propertyType.label,
        stats: {
          totalBookings: p._count.bookings,
        },
        createdAt: p.createdAt,
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
}

export default new LandlordService();