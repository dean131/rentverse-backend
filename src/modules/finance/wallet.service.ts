import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js"; 
import financeRepository from "./finance.repository.js";
import AppError from "../../shared/utils/AppError.js";
import logger from "../../config/logger.js";
import { PayoutRequestInput } from "./finance.schema.js";

class WalletService {
  /**
   * Get User Wallet (Auto-create if not exists)
   */
  async getMyWallet(userId: string) {
    let wallet = await financeRepository.findWalletByUserId(userId);
    if (!wallet) {
      wallet = await financeRepository.createWallet(userId);
    }
    return wallet;
  }

  /**
   * Process Rent Split
   * Logic: 5% Platform Fee, Credit Remainder to Landlord
   */
  async processRentSplit(invoiceId: string, grossAmount: number, landlordId: string) {
    const PLATFORM_FEE_PERCENT = 0.05;

    // 1. Business Logic: Calculate Amounts
    const fee = grossAmount * PLATFORM_FEE_PERCENT;
    const netIncome = grossAmount - fee;

    return await prisma.$transaction(async (tx) => {
      // 2. Get Wallet (with lock inside tx)
      const wallet = await financeRepository.getWalletForUpdate(tx, landlordId);

      // 3. Calculate New State
      const newBalance = Number(wallet.balance) + netIncome;

      // 4. Update DB via Repository
      await financeRepository.updateBalance(tx, wallet.id, newBalance);

      await financeRepository.createTransaction(tx, {
        walletId: wallet.id,
        amount: netIncome,
        type: "CREDIT",
        category: "RENT_INCOME",
        description: `Income from Invoice #${invoiceId} (Fee: ${fee})`,
        referenceId: invoiceId,
        balanceAfter: newBalance,
      });

      logger.info(`[Finance] Credited ${netIncome} to wallet ${wallet.id}`);
      return { newBalance, fee };
    });
  }

  /**
   * Handle Payout Request
   * Logic: Validate Balance -> Deduct -> Create Request
   */
  async requestPayout(userId: string, input: PayoutRequestInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get Wallet (Lock)
      const wallet = await financeRepository.getWalletForUpdate(tx, userId);

      // 2. Business Logic: Validation
      if (Number(wallet.balance) < input.amount) {
        throw new AppError("Insufficient wallet balance", 400);
      }

      // 3. Calculate New State
      const newBalance = Number(wallet.balance) - input.amount;

      // 4. Update DB via Repository
      // A. Deduct Money
      await financeRepository.updateBalance(tx, wallet.id, newBalance);

      // B. Create Payout Record
      const payout = await financeRepository.createPayoutRequest(tx, {
        walletId: wallet.id,
        ...input,
      });

      // C. Log Transaction (DEBIT)
      await financeRepository.createTransaction(tx, {
        walletId: wallet.id,
        amount: input.amount,
        type: "DEBIT",
        category: "PAYOUT_REQUEST",
        description: `Withdrawal request #${payout.id.substring(0, 8)}`,
        referenceId: payout.id,
        balanceAfter: newBalance,
      });

      return payout;
    });
  }
}

export default new WalletService();
