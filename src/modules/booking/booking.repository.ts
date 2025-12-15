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
    filters?: { search?: string; status?: string } // Accept filters
  ) {
    // 1. Base Filter (User Role)
    const where: Prisma.BookingWhereInput = {};

    if (role === "TENANT") {
      where.tenantId = userId;
    } else if (role === "LANDLORD") {
      where.property = { landlordId: userId };
    }

    // 2. Status Filter (e.g., "PENDING_PAYMENT", "ACTIVE")
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    // 3. Search Filter (Search by Property Title)
    if (filters?.search) {
      where.property = {
        ...(where.property || {}), // Preserve existing relation filter
        title: { contains: filters.search, mode: "insensitive" },
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
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          invoices: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true, amount: true, currency: true },
          },
          tenant: { select: { name: true, avatarUrl: true } },
        },
      }),
    ]);

    return { total, bookings };
  }

  /**
   * Find a booking specifically for a landlord (Ownership check)
   */
  async findForLandlord(bookingId: string, landlordId: string) {
    return await prisma.booking.findFirst({
      where: {
        id: bookingId,
        property: { landlordId }, // Ensure landlord owns the property
      },
      include: {
        property: true,
        tenant: { select: { email: true, name: true, id: true } },
      },
    });
  }

  /**
   * Update Booking Status
   */
  async updateStatus(bookingId: string, status: string, reason?: string) {
    // If rejected, we might want to store the reason in metadata or a separate field.
    // For now, we'll assume metadata usage or just status update.
    return await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        // Optional: Save rejection reason in metadata if schema supports it
        // metadata: reason ? { rejectionReason: reason } : undefined
      },
    });
  }

  /**
   * Find all future active bookings to block dates on the frontend calendar.
   */
  async findFutureBookings(propertyId: string) {
    return await prisma.booking.findMany({
      where: {
        propertyId,
        // We include 'BLOCKED' for iCal/External syncs we discussed earlier
        status: { in: ["ACTIVE", "PENDING_PAYMENT", "CONFIRMED", "BLOCKED"] },
        endDate: { gte: new Date() }, // Only future/current bookings
      },
      select: {
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: "asc" },
    });
  }

  /**
   * Find active bookings that need a new invoice generated.
   * Condition: Status is ACTIVE/CONFIRMED, and nextPaymentDate is today or in the past.
   */
  async findDueBookings() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.booking.findMany({
      where: {
        status: { in: ["ACTIVE", "CONFIRMED"] },
        nextPaymentDate: { lte: today },
        billingPeriodId: { not: null }, // Only recurring bookings
      },
      include: {
        billingPeriod: true,
        property: { select: { price: true, title: true, landlordId: true } },
        tenant: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /**
   * Process Recurring Billing Transaction
   * 1. Create new Invoice
   * 2. Update Booking's nextPaymentDate
   */
  async processRecurringInvoice(
    bookingId: string,
    nextDate: Date,
    amount: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          bookingId,
          amount: new Prisma.Decimal(amount),
          dueDate: new Date(), // Due immediately upon generation
          status: "PENDING",
        },
      });

      // 2. Update Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          nextPaymentDate: nextDate,
        },
      });

      return invoice;
    });
  }
}

export default new BookingRepository();
