import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StoresModule } from './domains/stores/stores.module';
import { PdvsModule } from './domains/pdvs/pdvs.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CommonModule } from './common/common.module';
import { CacheModule } from './common/cache/cache.module';
import { ProvidersModule } from './infrastructure/providers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConnectionString = configService.get<string>('DATABASE') || '';
        const password = configService.get<string>('DATABASE_PASSWORD') || '';

        if (!dbConnectionString) {
          throw new Error('Database connection string not found in environment variables');
        }

        const uri = dbConnectionString.replace('<PASSWORD>', password);

        return {
          uri,
        };
      },
    }),
    CacheModule,
    ProvidersModule,
    CommonModule,
    StoresModule,
    PdvsModule,
  ],
  providers: [
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}