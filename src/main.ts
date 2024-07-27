import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { readFileSync } from "fs";
import { CorsOrigins, ENVIRONMENT } from "./constants";

async function bootstrap() {
  let httpsOptions = {};

  //ssl for localhost for staging and production
  if (process.env.NODE_ENV !== ENVIRONMENT.LOCAL) {
    httpsOptions = {
      httpsOptions: {
        key: readFileSync(process.env.SSL_KEY_PATH),
        cert: readFileSync(process.env.SSL_CERT_PATH),
      },
    };
  }

  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
    cors: {
      origin: CorsOrigins,
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Authorization"],
      credentials: true,
    },
    ...httpsOptions,
  });

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Casino backend")
    .setDescription("Описание API")
    .setVersion("1.2")
    .addTag("admin", "Админ")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT"
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // global validation
  app.useGlobalPipes(
    new ValidationPipe({ forbidNonWhitelisted: true, transform: true })
  );
  //app.useWebSocketAdapter(new WsAdapter(app))
  await app.listen(process.env.PORT);
}
bootstrap();
