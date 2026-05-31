import { Controller, Get, Header } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Get()
  @Header("Cache-Control", "no-store")
  check() {
    return {
      ok: true,
      service: "ledgent-api",
      environment: this.config.get<string>("NODE_ENV", "development"),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }

  @Public()
  @Get("ready")
  @Header("Cache-Control", "no-store")
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      service: "ledgent-api",
      database: "reachable",
      timestamp: new Date().toISOString()
    };
  }
}
