import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { AuthContext } from "../types/auth.js";

export class AuthService {
  /**
   * Retrieves the user's active organization from their session.
   * NEVER trusts client-supplied organizationId.
   * Always derives from the authenticated session.
   */
  async getCurrentOrganization(userId: string): Promise<string | null> {
    const membership = await prisma.member.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true },
    });

    return membership?.organizationId ?? null;
  }

  /**
   * Returns a fully resolved auth context for the given session.
   * Throws if the user has no organization membership.
   */
  async resolveAuthContext(
    userId: string,
    sessionId: string
  ): Promise<AuthContext> {
    const [user, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.member.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { organizationId: true, role: true },
      }),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (!membership) {
      throw new Error("User has no organization membership");
    }

    return {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      sessionId,
    };
  }

  /**
   * Verifies that a user belongs to the given organization.
   * Used as a guard in all data-access paths.
   */
  async verifyOrganizationMembership(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const membership = await prisma.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!membership) {
      logger.warn({ userId, organizationId }, "Unauthorized org access attempt");
      return false;
    }

    return true;
  }
}

export const authService = new AuthService();
