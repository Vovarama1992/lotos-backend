import { Module } from "@nestjs/common";
import { RedisService } from "src/redis/redis.service";
import { ConfigService } from "../config.service";

@Module({
  providers: [ConfigService, RedisService],
  exports: [ConfigService]
})
export class ConfigModule {}
