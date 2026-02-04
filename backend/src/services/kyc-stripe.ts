// @ts-nocheck
import Stripe from "stripe";
import { prisma } from "../app";
import { logger } from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export class StripeKYCService {
  async createVerificationSession(userId: string) {
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          userId,
        },
        options: {
          document: {
            require_matching_selfie: true,
          },
        },
      });

      await prisma.kycVerification.create({
        data: {
          userId,
          sessionId: session.id,
          provider: "stripe",
          status: "pending",
        },
      });

      return session;
    } catch (error) {
      logger.error("KYC session creation failed", { error });
      throw error;
    }
  }

  async checkStatus(sessionId: string) {
    const session =
      await stripe.identity.verificationSessions.retrieve(sessionId);

    const statusMap: Record<string, string> = {
      verified: "approved",
      requires_input: "pending",
      canceled: "cancelled",
      processing: "pending",
    };

    const status = statusMap[session.status] || "pending";

    await prisma.kycVerification.update({
      where: { sessionId },
      data: {
        status,
        completedAt: status === "approved" ? new Date() : null,
      },
    });

    return { status, session };
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object;
      if (session && "id" in session) {
        await this.checkStatus(session.id);
      }
    } else if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object;
      if (session && "id" in session) {
        await this.checkStatus(session.id);
      }
    }
  }

  async getUserVerificationStatus(userId: string) {
    const verification = await prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return { verified: false, status: null };
    }

    return {
      verified: verification.status === "approved",
      status: verification.status,
      completedAt: verification.completedAt,
    };
  }
}

export default new StripeKYCService();

