import ical from "ical-generator";
import prisma from "../../config/prisma.js";
import AppError from "../../shared/utils/AppError.js";

class CalendarService {
  /**
   * Generate iCal String for a Property
   * Only includes CONFIRMED Rentverse bookings to share with Airbnb.
   */
  async generateExportIcal(propertyId: string) {
    // 1. Fetch Property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new AppError("Property not found", 404);

    // 2. Fetch Active Rentverse Bookings
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        source: "RENTVERSE", // ONLY export our own bookings (prevent loop)
      },
    });

    // 3. Create Calendar
    const calendar = ical({
      name: `Rentverse - ${property.title}`,
      timezone: "Asia/Jakarta",
    });

    bookings.forEach((b) => {
      calendar.createEvent({
        start: b.startDate,
        end: b.endDate,
        summary: "Rentverse Booking", // Privacy: Don't show tenant name
        // [FIX] Use 'id' instead of 'uid' to satisfy TypeScript
        id: b.id, 
      });
    });

    return calendar.toString();
  }
}

export default new CalendarService();