import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: 'localhost', // или другой адрес вашего сервера Redis
      port: 6379, // стандартный порт Redis
      password: "eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81"
    });
  }

  async set(key: string, value: string) {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async setCode(key, code) {
    await this.client.setex(key, 300, code)
  }

  async del(key: string) {
    await this.client.del(key)
  }
}
