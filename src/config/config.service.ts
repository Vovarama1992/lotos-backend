import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { CasinoConfig } from './entities/config.entity';

const ConfigRedisKey = 'config';

@Injectable()
export class ConfigService {
    public constructor(
        private readonly redisService: RedisService
    ){}

    async save(data: Partial<CasinoConfig>){
        const currentConfig = await this.get();
        const modifiedConfig = {...currentConfig, ...data};
        return await this.redisService.setJSON(ConfigRedisKey, modifiedConfig)
    }

    async get(): Promise<CasinoConfig>{
        return await this.redisService.getJSON(ConfigRedisKey)
    }
}
