import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST, // или другой адрес вашего сервера Redis
      port: +process.env.REDIS_PORT, // стандартный порт Redis
      password: process.env.REDIS_PASSWORD,
    });
  }

  async addElementToSet(setName: string, key: string) {
    await this.client.sadd(setName, key);
  }

  async removeElementFromSet(setName: string, key: string) {
    await this.client.srem(setName, key);
  }

  async getElementsFromSet(setName: string) {
    return await this.client.smembers(setName);
  }

  async isSetMember(setName: string, key: string) {
    return this.client.sismember(setName, key);
  }

  async set(key: string, value: string) {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async setJSON(key: string, value: Record<string, any>) {
    await this.client.set(key, JSON.stringify(value));
  }

  async getJSON(key: string) {
    const jsonString = await this.client.get(key);
    return JSON.parse(jsonString);
  }

  async setCode(key, code) {
    await this.client.setex(key, 300, code);
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
