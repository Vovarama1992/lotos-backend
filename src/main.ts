import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Casino backend")
    .setDescription("Описание API")
    .setVersion("1.2")
    .addTag("admin", "Админ")
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
  // global validation
  app.useGlobalPipes(
    new ValidationPipe({ forbidNonWhitelisted: true, transform: true })
  );
  //app.useWebSocketAdapter(new WsAdapter(app))
  await app.listen(process.env.PORT);
}
bootstrap();
