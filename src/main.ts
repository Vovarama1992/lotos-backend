import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Casino backend")
    .setDescription("Описание API")
    .setVersion("1.2")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://lotos.na4u.ru",
      "http://95.213.173.58:5173",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  await app.listen(process.env.PORT);
}
bootstrap();
