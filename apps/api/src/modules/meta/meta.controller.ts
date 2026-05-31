import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("meta")
@Controller("meta")
export class MetaController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  getMeta() {
    const appUrl = this.config.get<string>("APP_URL", "http://localhost:5173").split(",")[0].trim();

    return {
      title: "Ledgent AI",
      description: "AI-powered accounts payable automation for invoice intake, matching, approvals, ERP posting, and audit.",
      logoUrl: `${appUrl}/ledgent-logo.svg`,
      iconUrl: `${appUrl}/ledgent-icon.svg`,
      themeColor: "#e7c68b"
    };
  }
}
