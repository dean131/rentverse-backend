import prisma from '../../config/prisma.js';

class RentalRepository {
  /**
   * Fetch all Property Types (e.g. Apartment, House)
   */
  async findAllPropertyTypes() {
    return await prisma.propertyType.findMany({
      orderBy: { label: 'asc' },
    });
  }

  /**
   * Fetch all Listing Types (e.g. Rent, Sale)
   */
  async findAllListingTypes() {
    return await prisma.listingType.findMany({
      orderBy: { label: 'asc' },
    });
  }

  /**
   * Fetch all Billing Periods (e.g. Monthly, Yearly)
   */
  async findAllBillingPeriods() {
    return await prisma.billingPeriod.findMany({
      orderBy: { durationMonths: 'asc' },
    });
  }

  /**
   * Fetch all Dynamic Attribute Definitions (e.g. Bedroom, WiFi)
   */
  async findAllAttributeTypes() {
    return await prisma.propertyAttributeType.findMany({
      orderBy: { label: 'asc' },
    });
  }
}

export default new RentalRepository();