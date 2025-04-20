import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheConfigService } from './cache-config.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('CACHE_DEFAULT_TTL_MS', 300000),
      }),
    }),
  ],
  providers: [
    CacheConfigService,
  ],
  exports: [
    NestCacheModule,
    CacheConfigService,
  ],
})
export class CacheModule {} 