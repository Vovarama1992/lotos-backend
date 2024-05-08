import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";

import { UsersModule } from "./user/user.module";
import { AuthMiddleware } from "./auth/middleware/auth.middleware";
import { GamesService } from "./games/games.service";
import { GamesModule } from "./games/games.module";
import { RedisService } from "./redis/redis.service";
import { FreespinModule } from "./freespin/freespin.module";

import { User } from "./user/entities/user.entity";
import { Freespin } from "./freespin/entities/freespin.entity";
import { CardModule } from "./card/card.module";
import { Card } from "./card/entities/card.entity";
import { GameHistoryModule } from "./game-history/game-history.module";
import { GameHistory } from "./game-history/entities/game-history.entity";
import { DocumentsModule } from "./documents/documents.module";
//import { MailModule } from './mail/mail.module';
import { GatewayModule } from "./gateway/gateway.module";
import { AppGateway } from "./app.gateway";
import { CryptocloudService } from './cryptocloud/cryptocloud.service';
import { PaymentModule } from './payment/payment.module';
import { UserService } from "./user/user.service";
import { Transaction } from "./user/entities/transaction.entity";
import { TransactionModule } from './transaction/transaction.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.getOrThrow("POSTGRES_HOST"),
        port: configService.getOrThrow("POSTGRES_PORT"),
        password: configService.getOrThrow("POSTGRES_PASSWORD"),
        username: configService.getOrThrow("POSTGRES_USER"),
        autoLoadEntities: true,
        entities: [User, Freespin, Card, GameHistory, Transaction],
        database: configService.getOrThrow("POSTGRES_DB"),
        synchronize: configService.getOrThrow("TYPEORM_AUTOMIGRATE"),
        logging: configService.getOrThrow("TYPEORM_LOGGING"),
      }),
      inject: [ConfigService]
    }),
    UsersModule,
    GamesModule,
    FreespinModule,
    CardModule,
    GameHistoryModule,
    DocumentsModule,
    GatewayModule,
    PaymentModule,
    TransactionModule,
    AdminModule,
    //MailModule
  ],
  controllers: [],
  providers: [GamesService, RedisService, AppGateway, CryptocloudService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
