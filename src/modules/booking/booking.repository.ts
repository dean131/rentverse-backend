import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class BookingRepository {
  /**
   * Check if a property is already booked for the given date range.
   * Logic: (StartA <= EndB) and (EndA >= StartB)
   */
  async findConflictingBookings(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ["ACTIVE", "PENDING_PAYMENT"] }, // Ignore cancelled
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });
  }

  /**
   * Create Booking and First Invoice in one transaction
   */
  async createBookingWithInvoice(data: {
    tenantId: string;
    propertyId: string;
    billingPeriodId: number;
    startDate: Date;
    endDate: Date;
    nextPaymentDate: Date;
    amount: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Booking
      const booking = await tx.booking.create({
        data: {
          tenantId: data.tenantId,
          propertyId: data.propertyId,
          billingPeriodId: data.billingPeriodId,
          startDate: data.startDate,
          endDate: data.endDate,
          nextPaymentDate: data.nextPaymentDate,
          status: "PENDING_PAYMENT",
        },
        include: { property: { select: { title: true, landlordId: true } } },
      });

      // 2. Create First Invoice
      const invoice = await tx.invoice.create({
        data: {
          bookingId: booking.id,
          amount: new Prisma.Decimal(data.amount),
          dueDate: new Date(), // Due immediately
          status: "PENDING",
        },
      });

      return { booking, invoice };
    });
  }

  /**
   * Find bookings for a specific user (Tenant or Landlord).
   * Includes Property details and the latest Invoice status.
   */
  async findAllByUser(
    userId: string, 
    role: string, 
    limit = 10, 
    cursor?: string,
    filters?: { search?: string; status?: string } // [NEW] Accept filters
  ) {
    // 1. Base Filter (User Role)
    const where: Prisma.BookingWhereInput = {};

    if (role === 'TENANT') {
      where.tenantId = userId;
    } else if (role === 'LANDLORD') {
      where.property = { landlordId: userId };
    }

    // 2. [NEW] Status Filter (e.g., "PENDING_PAYMENT", "ACTIVE")
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    // 3. [NEW] Search Filter (Search by Property Title)
    if (filters?.search) {
      where.property = {
        ...(where.property || {}), // Preserve existing relation filter
        title: { contains: filters.search, mode: 'insensitive' }
      };
    }

    // 4. Cursor Logic (Same as before)
    const cursorObj = cursor ? { id: cursor } : undefined;
    const skip = cursor ? 1 : 0;

    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        take: limit,
        skip,
        cursor: cursorObj,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } }
            }
          },
          invoices: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, amount: true, currency: true }
          },
          tenant: { select: { name: true, avatarUrl: true } }
        }
      })
    ]);

    return { total, bookings };
  }
}

export default new BookingRepository();
