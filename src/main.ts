import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { StoreModule } from './store.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    StoreModule,
    new FastifyAdapter({ logger: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
