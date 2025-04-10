import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreModule } from './stores/store.module';

@Module({

  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available throughout your application
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = configService.get<string>('DATABASE') as string;
        const password = configService.get<string>('DATABASE_PASSWORD') as string;
        const uri = database.replace('<PASSWORD>', password);
        return { uri };
      },
    }),
    StoreModule,
  ],
})
export class AppModule {}