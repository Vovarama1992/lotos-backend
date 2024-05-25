import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { readFileSync } from "fs";
import * as express from "express"
import { ExpressAdapter } from "@nestjs/platform-express";
const expressInstance = express();

async function bootstrap() {
  let httpsOptions = {};
  if (process.env.ENV !== "dev") {
    httpsOptions = {
      key: readFileSync(process.env.SSL_KEY_PATH),
      cert: readFileSync(process.env.SSL_CERT_PATH),
    };
  }

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance), {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://lotos.na4u.ru",
        "http://95.213.173.58:5173",
        "http://adarfawerf.ru",
        "https://adarfawerf.ru",
      ],
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Authorization"],
      credentials: true,
    },
    httpsOptions,
  });
  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Casino backend")
    .setDescription("Описание API")
    .setVersion("1.2")
    .addTag("admin", "Админ")
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
