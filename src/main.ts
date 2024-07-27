import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { readFileSync } from "fs";
// import * as express from "express"
// import { ExpressAdapter } from "@nestjs/platform-express";
//const expressInstance = express();

async function bootstrap() {
  let httpsOptions = {};

  if (process.env.ENV !== "dev") {
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
      origin: [
        "http://localhost:5173",
        "http://lotos.na4u.ru",
        "https://lotos.na4u.ru",
        "http://adarfawerf.ru",
        "https://adarfawerf.ru",
        "https://lotos-casino.pro",
        "https://lotos-casino.com",
        "https://lotos-casino.net",
        "https://lotos-casino.site",
        "https://lotoscasino.site",
        process.env.FRONTEND_URL
      ],
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
