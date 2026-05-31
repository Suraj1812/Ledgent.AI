import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  async markRead(organizationId: string, userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, organizationId, userId },
      data: { readAt: new Date() }
    });

    return { ok: true };
  }
}
