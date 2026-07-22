import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const uri = this.configService.get<string>('REDIS_URI');

    if (!uri) {
      this.logger.warn('REDIS_URI is not configured; Redis client disabled');
      return;
    }

    this.client = new Redis(uri, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  private ensureClient(): Redis {
    if (!this.client) {
      throw new Error('Redis is not configured');
    }

    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.ensureClient().get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<'OK' | null> {
    const client = this.ensureClient();

    if (ttlSeconds) {
      return client.set(key, value, 'EX', ttlSeconds);
    }

    return client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.ensureClient().del(...keys);
  }
}
