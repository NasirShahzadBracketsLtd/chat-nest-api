import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import * as AWS from 'aws-sdk';

// Configure AWS SDK
@Injectable()
export class AwsElasticCashService implements OnModuleDestroy {
  private redisClient: Redis;

  private logger = new Logger(AwsElasticCashService.name);

  private readonly elasticache: AWS.ElastiCache;

  // async onModuleInit() {
  //   this.redisClient = new Redis({
  //     host: process.env.AWS_ELASTIC_CACHE_URL,
  //     port: 6379, // Default Redis port
  //     connectTimeout: 10000, //
  //     retryStrategy: (times) => {
  //       this.logger.log(`Retrying connection to Redis: attempt #${times}`);
  //       return Math.min(times * 50, 2000);
  //     },
  //   });

  //   this.redisClient.on('error', (error) => {
  //     console.error('Redis connection error:', error);
  //   });

  //   this.redisClient.on('connect', () => {
  //     console.log('Successfully connected to Redis');
  //   });
  // }

  constructor() {
    // AWS.config.update({
    //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    //   region: process.env.AWS_REGION,
    // });
    // AWS.config.update({
    //   region: process.env.AWS_REGION,
    //   credentials: new AWS.Credentials(
    //     process.env.AWS_ACCESS_KEY_ID,
    //     process.env.AWS_SECRET_ACCESS_KEY,
    //   ),
    // });
    // this.elasticache = new AWS.ElastiCache();
    // this.redisClient = new Redis({
    //   host: process.env.AWS_ELASTIC_CACHE_URL, // Replace with your ElastiCache Redis endpoint
    //   port: 6379, // Default Redis port
    //   connectTimeout: 10000, //
    // });
    // this.redisClient.on('connect', () => {
    //   this.logger.log('Successfully connected to Redis');
    // });
    // this.redisClient.on('error', (error) => {
    //   this.logger.error('Redis Client Error', error);
    // });
    // this.redisClient.on('reconnecting', () => {
    //   this.logger.log('Redis Client is reconnecting');
    // });
    // this.redisClient.on('end', () => {
    //   this.logger.log('Redis Client connection closed');
    // });
  }

  async checkConnection() {
    try {
      const result = await this.elasticache.describeCacheClusters().promise();
      console.log('Connected to AWS ElastiCache:', result);
      return result;
    } catch (error) {
      console.error('Error connecting to AWS ElastiCache:', error.message);
      throw new Error(`Connection check failed: ${error.message}`);
    }
  }

  async setValue(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async getValue(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async deleteValue(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }
}
