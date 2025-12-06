import rentalRepository from "./rental.repository.js";

class RentalService {
  /**
   * Get all reference data required for the "Create Property" form.
   * Fetches everything in parallel for maximum performance.
   */
  async getAllReferences() {
    const [propertyTypes, listingTypes, billingPeriods, attributes] =
      await Promise.all([
        rentalRepository.findAllPropertyTypes(),
        rentalRepository.findAllListingTypes(),
        rentalRepository.findAllBillingPeriods(),
        rentalRepository.findAllAttributeTypes(),
      ]);

    return {
      propertyTypes,
      listingTypes,
      billingPeriods,
      attributes,
    };
  }
}

export default new RentalService();
