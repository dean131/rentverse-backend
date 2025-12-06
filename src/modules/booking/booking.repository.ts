import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';

class BookingRepository {
  /**
   * Check if a property is already booked for the given date range.
   * Logic: (StartA <= EndB) and (EndA >= StartB)
   */
  async findConflictingBookings(propertyId: string, startDate: Date, endDate: Date) {
    return await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ['ACTIVE', 'PENDING_PAYMENT'] }, // Ignore cancelled
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
        ],
      },
    });
  }

  /**
   * Create Booking and First Invoice in one transaction
   */
  async createBookingWithInvoice(
    data: {
      tenantId: string;
      propertyId: string;
      billingPeriodId: number;
      startDate: Date;
      endDate: Date;
      nextPaymentDate: Date;
      amount: number;
    }
  ) {
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
          status: 'PENDING_PAYMENT',
        },
        include: { property: { select: { title: true, landlordId: true } } }
      });

      // 2. Create First Invoice
      const invoice = await tx.invoice.create({
        data: {
          bookingId: booking.id,
          amount: new Prisma.Decimal(data.amount),
          dueDate: new Date(), // Due immediately
          status: 'PENDING',
        },
      });

      return { booking, invoice };
    });
  }
}

export default new BookingRepository();