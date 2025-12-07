import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { snap, coreApi } from "../../config/midtrans.js";
import AppError from "../../shared/utils/AppError.js";
import eventBus from "../../shared/bus/event-bus.js";
import logger from "../../config/logger.js";

class PaymentService {
  /**
   * 1. Generate Snap Token
   * Called when user clicks "Pay Now".
   */
  async createTransaction(userId: string, invoiceId: string) {
    // A. Validate Invoice & Ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          include: {
            tenant: true,
            property: true,
          },
        },
      },
    });

    if (!invoice) throw new AppError("Invoice not found", 404);
    if (invoice.booking.tenantId !== userId)
      throw new AppError("Unauthorized access to this invoice", 403);
    if (invoice.status === "PAID")
      throw new AppError("Invoice is already paid", 400);

    // B. Prepare Midtrans Parameter
    const parameter = {
      transaction_details: {
        order_id: invoice.id, // We use Invoice UUID as Order ID
        gross_amount: Number(invoice.amount),
      },
      customer_details: {
        first_name: invoice.booking.tenant.name,
        email: invoice.booking.tenant.email,
        phone: invoice.booking.tenant.phone || undefined,
      },
      item_details: [
        {
          id: invoice.booking.propertyId,
          price: Number(invoice.amount),
          quantity: 1,
          name: `Rent: ${invoice.booking.property.title.substring(0, 49)}`, // Max 50 chars
        },
      ],
      // [Mobile Deep Link] Redirects user back to app after payment
      callbacks: {
        finish: "rentverse://payment/finish",
      },
    };

    // C. Request Token from Midtrans
    const transaction = await snap.createTransaction(parameter);

    // D. Save Token to Database
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        snapToken: transaction.token,
        midtransOrderId: invoice.id,
      },
    });

    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  }

  /**
   * 2. Handle Webhook Notification
   * Called by Midtrans Server to update status.
   */
  async handleWebhook(notification: any) {
    // A. Verify Status with Core API (Security Check)
    const statusResponse = await coreApi.transaction.notification(notification);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    logger.info(
      `[Payment] Webhook received for ${orderId}: ${transactionStatus}`
    );

    const invoice = await prisma.invoice.findUnique({
      where: { id: orderId },
      include: { booking: true },
    });

    if (!invoice) {
      logger.error(
        `[Payment] Invoice ${orderId} not found during webhook processing`
      );
      return;
    }

    // B. Determine Internal Status
    let newStatus: "PAID" | "FAILED" | null = null;

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        newStatus = "PAID";
      }
    } else if (transactionStatus === "settlement") {
      newStatus = "PAID";
    } else if (["cancel", "deny", "expire"].includes(transactionStatus)) {
      newStatus = "FAILED";
    }

    // C. Execute State Transitions
    if (newStatus === "PAID" && invoice.status !== "PAID") {
      await prisma.$transaction([
        // 1. Mark Invoice as PAID
        prisma.invoice.update({
          where: { id: orderId },
          data: { status: "PAID", paidAt: new Date() },
        }),
        // 2. Activate Booking
        prisma.booking.update({
          where: { id: invoice.bookingId },
          data: { status: "ACTIVE" },
        }),
      ]);

      // D. Publish Success Event
      eventBus.publish("PAYMENT:PAID", {
        invoiceId: invoice.id,
        bookingId: invoice.bookingId,
        tenantId: invoice.booking.tenantId,
        amount: Number(invoice.amount),
        paidAt: new Date(),
      });

      logger.info(`[Payment] Invoice ${invoice.id} marked as PAID.`);
    } else if (newStatus === "FAILED") {
      await prisma.invoice.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      eventBus.publish("PAYMENT:FAILED", {
        invoiceId: invoice.id,
        reason: transactionStatus,
      });
    }
  }
}

export default new PaymentService();
