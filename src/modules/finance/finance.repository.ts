import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

class FinanceRepository {
  /**
   * Find existing wallet with transactions
   */
  async findWalletByUserId(userId: string) {
    return await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }

  /**
   * Create wallet AND return empty transactions array
   * This matches the return type of findWalletByUserId.
   */
  async createWallet(userId: string) {
    return await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
      },
      include: {
        transactions: true,
      },
    });
  }

  /**
   * ATOMIC TRANSACTION: Update Balance & Create Ledger Entry
   */
  async creditWallet(
    walletId: string,
    amount: number,
    details: {
      category: string;
      description: string;
      referenceId: string;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock & Get Current Balance
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { id: walletId },
      });

      const newBalance = Number(wallet.balance) + amount;

      // 2. Update Balance
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      });

      // 3. Create Ledger Entry
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          amount,
          type: "CREDIT",
          category: details.category,
          description: details.description,
          referenceId: details.referenceId,
          balanceAfter: newBalance,
        },
      });

      return { wallet, transaction };
    });
  }

  /**
   * Lock and Get Wallet by User ID
   * Needs to be called inside a transaction.
   */
  async getWalletForUpdate(tx: Prisma.TransactionClient, userId: string) {
    return await tx.wallet.findUniqueOrThrow({
      where: { userId },
    });
  }

  /**
   * Update Wallet Balance
   */
  async updateBalance(tx: Prisma.TransactionClient, walletId: string, newBalance: number) {
    return await tx.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });
  }

  /**
   * Log a Ledger Transaction
   */
  async createTransaction(
    tx: Prisma.TransactionClient,
    data: {
      walletId: string;
      amount: number;
      type: string;
      category: string;
      description: string;
      referenceId: string;
      balanceAfter: number;
    }
  ) {
    return await tx.walletTransaction.create({
      data: {
        walletId: data.walletId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        referenceId: data.referenceId,
        balanceAfter: data.balanceAfter,
      },
    });
  }

  /**
   * Create Payout Request Record
   */
  async createPayoutRequest(
    tx: Prisma.TransactionClient,
    data: {
      walletId: string;
      amount: number;
      bankName: string;
      accountNo: string;
      accountName: string;
      notes?: string;
    }
  ) {
    return await tx.payoutRequest.create({
      data: {
        ...data,
        status: "PENDING",
      },
    });
  }
}

export default new FinanceRepository();
