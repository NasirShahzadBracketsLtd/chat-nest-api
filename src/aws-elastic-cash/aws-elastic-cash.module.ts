import { Global, Module } from '@nestjs/common';
import { AwsElasticCashService } from './aws-elastic-cash.service';
import { RedisModule } from 'nestjs-redis';

@Module({
  providers: [AwsElasticCashService],
  exports: [AwsElasticCashService],
})
export class AwsElasticCashModule {}
