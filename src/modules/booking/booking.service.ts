import bookingRepository from "./booking.repository.js";
import prisma from "../../config/prisma.js";
import AppError from "../../shared/utils/AppError.js";
import eventBus from "../../shared/bus/event-bus.js";
import { CreateBookingInput } from "./booking.schema.js";
import { env } from "../../config/env.js";
import storageService from "shared/services/storage.service.js";

class BookingService {
  /**
   * Create a new Booking Request.
   * Returns a snapshot of the reservation for the "Review & Pay" screen.
   */
  async createBooking(tenantId: string, input: CreateBookingInput) {
    // ---------------------------------------------------------
    // 1. Validation Phase
    // ---------------------------------------------------------

    // A. Validate Tenant KYC
    const tenantProfile = await prisma.tenantTrustProfile.findUnique({
      where: { userRefId: tenantId },
    });

    if (!tenantProfile || tenantProfile.kyc_status !== "VERIFIED") {
      throw new AppError(
        "You must complete KYC verification to book a property.",
        403
      );
    }

    // B. Fetch Property (with Billing Rules & Primary Image)
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      include: {
        allowedBillingPeriods: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!property) throw new AppError("Property not found", 404);
    if (property.landlordId === tenantId)
      throw new AppError("You cannot book your own property", 400);

    // C. Validate Billing Period
    const billingPeriod = await prisma.billingPeriod.findUnique({
      where: { id: input.billingPeriodId },
    });

    if (!billingPeriod) throw new AppError("Invalid billing period", 400);

    // D. Check if Property allows this Billing Period
    const isAllowed = property.allowedBillingPeriods.some(
      (bp) => bp.billingPeriodId === billingPeriod.id
    );
    if (!isAllowed)
      throw new AppError(
        "This billing period is not allowed for this property",
        400
      );

    // ---------------------------------------------------------
    // 2. Calculation Phase
    // ---------------------------------------------------------

    // Calculate Dates
    const startDate = new Date(input.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + billingPeriod.durationMonths);

    // Calculate Total Price (Base Price * Months)
    const totalAmount = Number(property.price) * billingPeriod.durationMonths;

    // ---------------------------------------------------------
    // 3. Availability Check
    // ---------------------------------------------------------
    const conflict = await bookingRepository.findConflictingBookings(
      input.propertyId,
      startDate,
      endDate
    );

    if (conflict) {
      throw new AppError(
        "Property is not available for the selected dates.",
        409
      );
    }

    // ---------------------------------------------------------
    // 4. Execution Phase (Atomic Transaction)
    // ---------------------------------------------------------
    const { booking, invoice } =
      await bookingRepository.createBookingWithInvoice({
        tenantId,
        propertyId: input.propertyId,
        billingPeriodId: input.billingPeriodId,
        startDate,
        endDate,
        nextPaymentDate: endDate, // Next payment due at end of period
        amount: totalAmount,
      });

    // ---------------------------------------------------------
    // 5. Post-Process (Notifications)
    // ---------------------------------------------------------
    eventBus.publish("BOOKING:CREATED", {
      bookingId: booking.id,
      landlordId: booking.property.landlordId,
      tenantId: tenantId,
      propertyTitle: booking.property.title,
    });

    // ---------------------------------------------------------
    // 6. Response Construction (For Mobile UI)
    // ---------------------------------------------------------

    // Resolve Image URL
    const imageUrl = property.images.length > 0
      ? storageService.getPublicUrl(property.images[0].url)
      : null;

    return {
      bookingId: booking.id,
      invoiceId: invoice.id,
      status: booking.status, // "PENDING_PAYMENT"

      // Transaction Details
      amount: totalAmount,
      currency: property.currency,

      // Property Snapshot (for Review Screen)
      property: {
        id: property.id,
        title: property.title,
        image: imageUrl,
        address: property.city, // Simple location context
      },

      // Reservation Details
      checkIn: booking.startDate,
      checkOut: booking.endDate,
      billingPeriod: billingPeriod.label,

      // Payment Urgency (e.g., 2 hours from now)
      paymentDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  }

  /**
   * Get "My Bookings" list.
   * Adapts response based on whether user is Tenant or Landlord.
   */
  async getMyBookings(userId: string, role: string, query: any) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as string | undefined;

    // Extract Filters
    const filters = {
      search: query.search as string,
      status: query.status as string, // "ACTIVE", "PENDING_PAYMENT", etc.
    };

    const { total, bookings } = await bookingRepository.findAllByUser(
      userId,
      role,
      limit,
      cursor,
      filters
    );

    let nextCursor: string | null = null;
    if (bookings.length === limit) {
      nextCursor = bookings[bookings.length - 1].id;
    }

    const data = bookings.map((booking) => {
      const property = booking.property;
      const imageUrl = property.images.length > 0 
        ? storageService.getPublicUrl(property.images[0].url) 
        : null;

      const invoice = booking.invoices[0];

      return {
        id: booking.id,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        property: {
          id: property.id,
          title: property.title,
          city: property.city,
          image: imageUrl,
        },
        payment: invoice
          ? {
              invoiceId: invoice.id,
              status: invoice.status,
              amount: Number(invoice.amount),
              currency: invoice.currency,
            }
          : null,
        createdAt: booking.createdAt,
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

  async confirmBooking(landlordId: string, bookingId: string) {
    const booking = await bookingRepository.findForLandlord(
      bookingId,
      landlordId
    );
    if (!booking) throw new AppError("Booking request not found", 404);

    if (
      booking.status !== "PENDING_PAYMENT" &&
      booking.status !== "PENDING_CONFIRMATION"
    ) {
      throw new AppError(
        `Cannot confirm booking with status ${booking.status}`,
        400
      );
    }

    const updated = await bookingRepository.updateStatus(
      bookingId,
      "CONFIRMED"
    );

    // Trigger Notification
    eventBus.publish("BOOKING:CONFIRMED", {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      propertyTitle: booking.property.title,
    });

    return updated;
  }

  async rejectBooking(landlordId: string, bookingId: string, reason: string) {
    const booking = await bookingRepository.findForLandlord(
      bookingId,
      landlordId
    );
    if (!booking) throw new AppError("Booking request not found", 404);

    if (["CANCELLED", "REJECTED", "COMPLETED"].includes(booking.status)) {
      throw new AppError("Booking is already finalized", 400);
    }

    const updated = await bookingRepository.updateStatus(
      bookingId,
      "REJECTED",
      reason
    );

    // Trigger Notification
    eventBus.publish("BOOKING:REJECTED", {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      propertyTitle: booking.property.title,
      reason,
    });

    return updated;
  }
}

export default new BookingService();
