import disputeRepository from "./dispute.repository.js";
import { CreateDisputeInput, ResolveDisputeInput } from "./dispute.schema.js";
import AppError from "../../shared/utils/AppError.js";
import eventBus from "../../shared/bus/event-bus.js";

class DisputeService {
  async createDispute(
    userId: string,
    bookingId: string,
    input: CreateDisputeInput
  ) {
    const booking = await disputeRepository.findBookingById(bookingId);
    if (!booking) throw new AppError("Booking not found", 404);

    const isTenant = booking.tenantId === userId;
    const isLandlord = booking.property.landlordId === userId;

    if (!isTenant && !isLandlord) {
      throw new AppError("You are not authorized to dispute this booking", 403);
    }

    if (["CANCELLED", "REJECTED"].includes(booking.status)) {
      throw new AppError("Cannot dispute a cancelled booking", 400);
    }

    return await disputeRepository.create(userId, bookingId, input);
  }

  /**
   * Get All Disputes
   */
  async getAllDisputes(status?: string) {
    return await disputeRepository.findAll({ status });
  }

  /**
   * Resolve Dispute
   */
  async resolveDispute(
    adminId: string,
    disputeId: string,
    input: ResolveDisputeInput
  ) {
    // 1. Fetch Dispute to check existence & context
    const dispute = await disputeRepository.findById(disputeId);
    if (!dispute) throw new AppError("Dispute not found", 404);

    if (dispute.status !== "OPEN") {
      throw new AppError("Dispute is already resolved", 400);
    }

    // 2. Map Resolution to Status
    const status =
      input.resolution === "REJECT_DISPUTE" ? "REJECTED" : "RESOLVED";

    // 3. Update DB
    const updatedDispute = await disputeRepository.resolve(disputeId, adminId, {
      status,
      resolution: input.resolution,
      adminNotes: input.adminNotes,
    });

    // 4. Trigger Penalties (Trust Engine)
    // "REFUND_TENANT" => Landlord lost (Penalty)
    if (input.resolution === "REFUND_TENANT") {
      eventBus.publish("ADMIN:TRUST_SCORE_ADJUSTED", {
        adminId,
        userId: dispute.booking.property.landlordId,
        role: "LANDLORD",
        scoreDelta: -20, // Strict penalty for losing dispute
        reason: `Dispute #${dispute.id} Resolved against Landlord: ${input.adminNotes}`,
      });
      // Future: eventBus.publish("FINANCE:REFUND", { ... })
    }
    // "PAYOUT_LANDLORD" => Tenant lost (Penalty)
    else if (input.resolution === "PAYOUT_LANDLORD") {
      eventBus.publish("ADMIN:TRUST_SCORE_ADJUSTED", {
        adminId,
        userId: dispute.booking.tenantId,
        role: "TENANT",
        scoreDelta: -15, // "DISPUTE_LOST"
        reason: `Dispute #${dispute.id} Resolved against Tenant: ${input.adminNotes}`,
      });
    }

    return updatedDispute;
  }

  /**
   * Get My Disputes (Tenant/Landlord)
   */
  async getMyDisputes(userId: string) {
    return await disputeRepository.findByInitiator(userId);
  }
}

export default new DisputeService();
