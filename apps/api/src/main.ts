import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  const appUrls = config
    .getOrThrow<string>("APP_URL")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  app.use(helmet());
  app.enableCors({
    origin: [...appUrls, "http://localhost:5173", "http://localhost:5174"],
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false
    })
  );

  const swagger = new DocumentBuilder()
    .setTitle("Ledgent.AI API")
    .setDescription("Accounts payable automation, invoice matching, approvals, ERP integrations, and finance AI.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  Logger.log(`Ledgent.AI API listening on http://localhost:${port}`, "Bootstrap");
}

bootstrap();
