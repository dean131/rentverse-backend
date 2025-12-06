import bookingRepository from './booking.repository.js';
import prisma from '../../config/prisma.js'; // Accessing other tables for read
import AppError from '../../shared/utils/AppError.js';
import eventBus from '../../shared/bus/event-bus.js';
import { CreateBookingInput } from './booking.schema.js';

class BookingService {
  async createBooking(tenantId: string, input: CreateBookingInput) {
    // 1. Validate Tenant KYC Status
    const tenantProfile = await prisma.tenantTrustProfile.findUnique({
      where: { userRefId: tenantId },
    });

    if (!tenantProfile || tenantProfile.kyc_status !== 'VERIFIED') {
      // NOTE: In Dev/Test, you might need to manually set kyc_status='VERIFIED' in DB
      throw new AppError('You must complete KYC verification to book a property.', 403);
    }

    // 2. Fetch Property & Billing Period Details
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      include: { allowedBillingPeriods: true },
    });

    if (!property) throw new AppError('Property not found', 404);
    if (property.landlordId === tenantId) throw new AppError('You cannot book your own property', 400);

    const billingPeriod = await prisma.billingPeriod.findUnique({
      where: { id: input.billingPeriodId },
    });

    if (!billingPeriod) throw new AppError('Invalid billing period', 400);

    // 3. Check if this property actually allows this billing period
    const isAllowed = property.allowedBillingPeriods.some(
      (bp) => bp.billingPeriodId === billingPeriod.id
    );
    if (!isAllowed) throw new AppError('This billing period is not allowed for this property', 400);

    // 4. Calculate Dates & Price
    // Logic: Price is treated as "Monthly Base Rate" * Duration Months
    const startDate = new Date(input.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + billingPeriod.durationMonths);

    const totalAmount = Number(property.price) * billingPeriod.durationMonths;

    // 5. Check Availability (Prevent Double Booking)
    const conflict = await bookingRepository.findConflictingBookings(
      input.propertyId,
      startDate,
      endDate
    );

    if (conflict) {
      throw new AppError('Property is not available for the selected dates.', 409);
    }

    // 6. Execute Transaction
    const { booking, invoice } = await bookingRepository.createBookingWithInvoice({
      tenantId,
      propertyId: input.propertyId,
      billingPeriodId: input.billingPeriodId,
      startDate,
      endDate,
      nextPaymentDate: endDate, // Simplify: Next payment is at end of current period
      amount: totalAmount,
    });

    // 7. Emit Event (Notify Landlord)
    eventBus.publish('BOOKING:CREATED', {
      bookingId: booking.id,
      landlordId: booking.property.landlordId,
      tenantId: tenantId,
      propertyTitle: booking.property.title,
    });

    return { 
      bookingId: booking.id, 
      invoiceId: invoice.id,
      status: booking.status,
      amount: totalAmount 
    };
  }
}

export default new BookingService();