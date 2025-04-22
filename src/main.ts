import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  const config = new DocumentBuilder()
    .setTitle('Physical Store API')
    .setDescription('API for managing physical stores and PDVs')
    .setVersion('1.0')
    .addTag('stores')
    .addTag('pdvs')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Physical Store API',
        description: 'API for managing physical stores and PDVs',
        version: '1.0',
      },
      tags: [
        { name: 'stores', description: 'Store endpoints' },
        { name: 'pdvs', description: 'PDV endpoints' },
      ],
    },
  });
  
  await app.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformSpecification: () => document,
  });
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();
